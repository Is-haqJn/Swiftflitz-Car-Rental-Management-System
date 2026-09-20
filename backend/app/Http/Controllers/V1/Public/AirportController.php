<?php

namespace App\Http\Controllers\V1\Public;

use App\DTOs\AirportBookingData;
use App\Enums\AirportLocationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicBookAirportRequest;
use App\Http\Resources\AirportBookingResource;
use App\Http\Resources\AirportLocationResource;
use App\Http\Resources\AirportPackageAssignmentResource;
use App\Http\Resources\AirportPackageResource;
use App\Http\Resources\AirportResource;
use App\Models\Airport;
use App\Models\AirportLocation;
use App\Models\AirportPackage;
use App\Models\AirportPackageAssignment;
use App\Models\Branch;
use App\Services\Contracts\AirportBookingServiceInterface;
use App\Settings\GeneralSettings;
use App\Support\CurrencyHelper;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AirportController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportBookingServiceInterface $bookingService,
        protected GeneralSettings $generalSettings,
    ) {}

    /**
     * GET /api/v1/public/airports
     * List active airports for public display (no authentication required).
     */
    public function airports(): JsonResponse
    {
        $airports = Airport::where('is_active', true)
            ->select(['id', 'name', 'city', 'country'])
            ->orderBy('city')
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            data: AirportResource::collection($airports),
            message: 'Airports retrieved successfully'
        );
    }

    /**
     * GET /api/v1/public/airport-packages
     * List active packages for public display.
     * When airport_id is provided, returns assignments with per-airport pricing.
     * Without airport_id, returns all active packages (price varies by airport).
     */
    public function packages(Request $request): JsonResponse
    {
        if ($request->filled('airport_id')) {
            $assignments = AirportPackageAssignment::where('airport_id', $request->airport_id)
                ->where('is_active', true)
                ->whereHas('package', fn ($q) => $q->where('is_active', true))
                ->with(['package', 'airport', 'airport.serviceableBranch'])
                ->get();

            $airport = $assignments->first()?->airport;
            $branch = $airport?->serviceableBranch;
            $currencyInfo = CurrencyHelper::resolveForBranch($branch, $this->generalSettings);

            $showConverted = $branch ? (bool) $branch->show_converted_price : false;
            $globalCurrency = $this->generalSettings->currency;
            $globalCurrencySymbol = $this->generalSettings->currency_symbol;

            $resources = $assignments->map(function (AirportPackageAssignment $assignment) use ($currencyInfo, $showConverted, $globalCurrency, $globalCurrencySymbol) {
                return (new AirportPackageAssignmentResource($assignment))->additional([
                    'currency_info' => $currencyInfo,
                    'global_currency' => $globalCurrency,
                    'global_currency_symbol' => $globalCurrencySymbol,
                    'show_converted' => $showConverted,
                ]);
            });

            return $this->successResponse(
                data: $resources->values(),
                message: 'Airport packages retrieved successfully'
            );
        }

        $packages = AirportPackage::where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            data: AirportPackageResource::collection($packages),
            message: 'Airport packages retrieved successfully'
        );
    }

    /**
     * GET /api/v1/public/airports/{airport}/terminals
     * List active terminals for a specific airport.
     */
    public function terminals(Airport $airport): JsonResponse
    {
        $terminals = AirportLocation::where('airport_id', $airport->id)
            ->where('location_type', AirportLocationType::Terminal)
            ->where('is_active', true)
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            data: AirportLocationResource::collection($terminals),
            message: 'Terminals retrieved successfully'
        );
    }

    /**
     * GET /api/v1/public/airports/{airport}/areas
     * List active area locations for the branch(es) associated with this airport.
     */
    public function areas(Airport $airport): JsonResponse
    {
        $areas = AirportLocation::where('location_type', AirportLocationType::Area)
            ->where('is_active', true)
            ->whereHas('branch', fn ($q) => $q->where('airport_id', $airport->id))
            ->select(['id', 'name', 'has_charge', 'charge_amount'])
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            data: AirportLocationResource::collection($areas),
            message: 'Areas retrieved successfully'
        );
    }

    /**
     * POST /api/v1/public/airport-bookings
     * Create a public airport booking (no authentication required).
     */
    public function book(PublicBookAirportRequest $request): JsonResponse
    {
        $assignment = AirportPackageAssignment::findOrFail($request->package_assignment_id);

        $branch = Branch::where('airport_id', $assignment->airport_id)
            ->where('has_airport_service', true)
            ->where('is_active', true)
            ->firstOrFail();

        $data = AirportBookingData::fromPublicRequest($request->validated(), $branch->id);

        $booking = $this->bookingService->create($data);

        return $this->successResponse(
            data: new AirportBookingResource($booking),
            message: 'Booking created successfully',
            statusCode: 201
        );
    }
}
