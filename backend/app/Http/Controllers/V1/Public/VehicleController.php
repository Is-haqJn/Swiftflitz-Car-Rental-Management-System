<?php

namespace App\Http\Controllers\V1\Public;

use App\Enums\ChargeScope;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicPricingPreviewRequest;
use App\Http\Resources\PricingBreakdownResource;
use App\Models\AdditionalCharge;
use App\Models\Vehicle;
use App\Services\Contracts\PricingServiceInterface;
use App\Services\Contracts\VehicleAvailabilityServiceInterface;
use App\Settings\GeneralSettings;
use App\Settings\PricingSettings;
use App\Settings\RentalSettings;
use App\Support\CurrencyHelper;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected VehicleAvailabilityServiceInterface $availability,
        protected PricingServiceInterface $pricingService,
        protected GeneralSettings $generalSettings,
    ) {}

    /**
     * GET /api/v1/public/vehicles
     * List available vehicles for the public listings page and quote-request dropdown.
     * Includes pricing visibility, features, primary image, and unavailable dates.
     */
    public function index(PricingSettings $pricingSettings): JsonResponse
    {
        $vehicles = Vehicle::query()
            ->whereIn('status', [
                VehicleStatus::Available->value,
                VehicleStatus::Rented->value,
            ])
            ->with(['category', 'branch', 'media'])
            ->orderByDesc('created_at')
            ->get();

        $vehicleIds = $vehicles->pluck('id')->all();
        $unavailableByVehicle = $this->availability->getBatchUnavailableDateRanges($vehicleIds);

        $vehicleData = $vehicles->map(function (Vehicle $v) use ($unavailableByVehicle) {
            $currencyInfo = CurrencyHelper::resolveForBranch($v->branch, $this->generalSettings);

            return [
                'id' => $v->id,
                'name' => $v->name,
                'make' => $v->make,
                'model' => $v->model,
                'year' => $v->year,
                'seats' => $v->seats,
                'fuel_type' => $v->fuel_type,
                'transmission' => $v->transmission,
                'daily_rate' => (float) $v->daily_rate,
                'price_visible' => $v->price_visible,
                'is_featured' => $v->is_featured,
                'features' => $v->features ?? [],
                'branch_id' => $v->branch_id,
                'branch_name' => $v->branch ? preg_replace('/\s*branch\s*$/i', '', $v->branch->name) : null,
                'category' => $v->category ? ['name' => $v->category->name] : null,
                'image' => ($primary = $v->getMedia('images')->first(fn ($m) => $m->getCustomProperty('is_primary')) ?? $v->getMedia('images')->first())
                    ? ($primary->hasGeneratedConversion('medium') ? $primary->getUrl('medium') : $primary->getUrl('thumb'))
                    : null,
                'unavailable_dates' => $unavailableByVehicle->get($v->id, collect())->values(),
                'currency' => $currencyInfo['code'],
                'currency_symbol' => $currencyInfo['symbol'],
                'exchange_rate' => $currencyInfo['rate'],
                'global_currency' => $this->generalSettings->currency,
                'global_currency_symbol' => $this->generalSettings->currency_symbol,
                'daily_rate_global' => $currencyInfo['rate'] ? CurrencyHelper::convertToGlobal((float) $v->daily_rate, $currencyInfo['rate']) : null,
                'show_converted_price' => $v->branch ? (bool) $v->branch->show_converted_price : false,
            ];
        });

        return $this->successResponse([
            'show_prices_on_website' => $pricingSettings->show_prices_on_website,
            'vehicles' => $vehicleData,
        ], 'Vehicles retrieved successfully');
    }

    /**
     * GET /api/v1/public/vehicles/{id}
     * Full vehicle detail for the public vehicle detail page.
     */
    public function show(string $id, PricingSettings $pricingSettings, RentalSettings $rentalSettings): JsonResponse
    {
        $vehicle = Vehicle::whereIn('status', [
            VehicleStatus::Available->value,
            VehicleStatus::Rented->value,
        ])
            ->with(['category', 'media', 'branch'])
            ->findOrFail($id);

        /* Branch exchange rate - used to convert global charges (branch_id=null, stored in GHS) to branch currency */
        $branchRate = $vehicle->branch?->exchange_rate !== null
            ? (float) $vehicle->branch->exchange_rate
            : null;

        // Fetch customer-selectable addons: regular scope, from this vehicle's branch or org-wide (no branch)
        $addons = AdditionalCharge::where('is_active', true)
            ->where('scope', ChargeScope::Regular->value)
            ->where(function ($q) use ($vehicle) {
                $q->whereNull('branch_id')
                    ->orWhere('branch_id', $vehicle->branch_id);
            })
            ->get()
            ->map(fn (AdditionalCharge $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'amount' => $a->branch_id === null
                    ? CurrencyHelper::convertFromGlobal((float) $a->amount, $branchRate)
                    : (float) $a->amount,
                'charge_type' => $a->charge_type->value,
            ]);

        // Fetch auto-applied charges (global, category-scoped, vehicle-scoped)
        $autoCharges = AdditionalCharge::where('is_active', true)
            ->whereIn('scope', [
                ChargeScope::Global->value,
                ChargeScope::Category->value,
                ChargeScope::Vehicle->value,
            ])
            ->where(function ($q) use ($vehicle) {
                $q->where('scope', ChargeScope::Global->value)
                    ->orWhere(function ($q2) use ($vehicle) {
                        $q2->where('scope', ChargeScope::Category->value)
                            ->where('category_id', $vehicle->category_id);
                    })
                    ->orWhere(function ($q2) use ($vehicle) {
                        $q2->where('scope', ChargeScope::Vehicle->value)
                            ->where('vehicle_id', $vehicle->id);
                    });
            })
            ->get()
            ->map(fn (AdditionalCharge $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'amount' => $a->branch_id === null
                    ? CurrencyHelper::convertFromGlobal((float) $a->amount, $branchRate)
                    : (float) $a->amount,
                'charge_type' => $a->charge_type->value,
            ]);

        $currencyInfo = CurrencyHelper::resolveForBranch($vehicle->branch, $this->generalSettings);

        /* Resolve security deposit (vehicle override -> category override -> global setting) */
        $depositAmount = $pricingSettings->charge_deposit
            ? round((float) ($vehicle->security_deposit ?? $vehicle->category?->security_deposit ?? $pricingSettings->global_security_deposit ?? 0), 2)
            : 0.0;

        $images = $vehicle->getMedia('images')
            ->sortByDesc('custom_properties.is_primary')
            ->map(fn ($m) => [
                'url' => $m->getUrl(),
                'thumb' => $m->getUrl('thumb') ?: $m->getUrl('medium') ?: $m->getUrl(),
                'is_primary' => (bool) ($m->getCustomProperty('is_primary') ?? false),
            ])
            ->values();

        return $this->successResponse([
            'show_prices_on_website' => $pricingSettings->show_prices_on_website,
            'allow_online_booking' => $rentalSettings->allow_online_booking,
            'vat_enabled' => $rentalSettings->vat_enabled,
            'vat_rate' => $rentalSettings->vat_rate,
            'charge_deposit' => $pricingSettings->charge_deposit,
            'security_deposit_amount' => $depositAmount,
            'vehicle' => [
                'id' => $vehicle->id,
                'branch_id' => $vehicle->branch_id,
                'name' => $vehicle->name,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'color' => $vehicle->color,
                'seats' => $vehicle->seats,
                'fuel_type' => $vehicle->fuel_type,
                'transmission' => $vehicle->transmission,
                'engine_size' => $vehicle->engine_size,
                'daily_rate' => (float) $vehicle->daily_rate,
                'price_visible' => $vehicle->price_visible,
                'description' => $vehicle->description,
                'features' => $vehicle->features ?? [],
                'category' => $vehicle->category ? ['name' => $vehicle->category->name] : null,
                'images' => $images,
                'addons' => $addons,
                'auto_charges' => $autoCharges,
                'unavailable_dates' => $this->availability->getUnavailableDateRanges($vehicle->id)->values(),
                'currency' => $currencyInfo['code'],
                'currency_symbol' => $currencyInfo['symbol'],
                'exchange_rate' => $currencyInfo['rate'],
                'global_currency' => $this->generalSettings->currency,
                'global_currency_symbol' => $this->generalSettings->currency_symbol,
                'daily_rate_global' => $currencyInfo['rate'] ? CurrencyHelper::convertToGlobal((float) $vehicle->daily_rate, $currencyInfo['rate']) : null,
                'show_converted_price' => $vehicle->branch ? (bool) $vehicle->branch->show_converted_price : false,
            ],
        ], 'Vehicle retrieved successfully');
    }

    /**
     * POST /api/v1/public/vehicles/{id}/pricing-preview
     * Compute an accurate price breakdown including discount rules for a public booking.
     * Used by the website booking confirmation page to show the exact backend-computed price.
     */
    public function pricingPreview(PublicPricingPreviewRequest $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);

        $addons = collect($request->addon_ids ?? [])
            ->map(fn (string $addonId) => ['id' => $addonId, 'quantity' => 1])
            ->values()
            ->all();

        $customerAge = $request->date_of_birth
            ? Carbon::parse($request->date_of_birth)->age
            : null;

        $breakdown = $this->pricingService->calculate(
            vehicle: $vehicle,
            pickupDate: $request->pickup_date,
            returnDate: $request->return_date,
            addons: $addons,
            pickupLocationId: $request->pickup_location_id,
            dropoffLocationId: $request->dropoff_location_id,
            customerAge: $customerAge,
        );

        return $this->successResponse(new PricingBreakdownResource($breakdown));
    }
}
