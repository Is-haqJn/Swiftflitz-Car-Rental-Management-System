<?php

namespace App\Http\Resources\Rentals;

use App\Models\Vehicle;
use App\Services\Contracts\PricingServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Throwable;

class QuoteRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pricing = null;

        if ($this->vehicle_id && $this->pickup_date && $this->return_date) {
            try {
                $vehicle = $this->relationLoaded('vehicle') ? $this->vehicle : Vehicle::find($this->vehicle_id);

                if ($vehicle) {
                    /** @var PricingServiceInterface $pricingService */
                    $pricingService = app(PricingServiceInterface::class);

                    $addons = collect($this->requested_addon_ids ?? [])
                        ->map(fn ($id) => ['id' => $id, 'quantity' => 1])
                        ->all();

                    // admin_base_price is stored as a per-day rate; multiply by rental days
                    $overrideBaseCost = null;
                    if ($this->admin_base_price !== null) {
                        $rentalDays = $pricingService->getRentalDays(
                            $this->pickup_date->format('Y-m-d'),
                            $this->return_date->format('Y-m-d')
                        );
                        $overrideBaseCost = round((float) $this->admin_base_price * $rentalDays, 2);
                    }

                    $breakdown = $pricingService->calculate(
                        vehicle: $vehicle,
                        pickupDate: $this->pickup_date->format('Y-m-d'),
                        returnDate: $this->return_date->format('Y-m-d'),
                        addons: $addons,
                        pickupLocationId: $this->pickup_location_id,
                        overrideBaseCost: $overrideBaseCost,
                    );

                    $pricing = [
                        'rental_days' => $breakdown->rentalDays,
                        'daily_rate' => $breakdown->dailyRate,
                        'base_cost' => $breakdown->base,
                        'additional_charges' => $breakdown->addonTotal,
                        'location_charge' => $breakdown->locationTotal,
                        'subtotal' => $breakdown->subtotal,
                        'total_discount_amount' => $breakdown->totalDiscountAmount,
                        'discounted_subtotal' => $breakdown->discountedSubtotal,
                        'tax_amount' => $breakdown->taxAmount,
                        'vat_amount' => $breakdown->taxAmount,
                        'total_cost' => $breakdown->totalAmount,
                        'security_deposit_amount' => $breakdown->depositAmount,
                        'breakdown' => $breakdown->breakdown,
                    ];
                }
            } catch (Throwable) {
                // Pricing calculation failure should not break the resource
            }
        }

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'rental_days' => $this->rental_days,
            'expected_pickup_date' => $this->expected_pickup_date?->format('Y-m-d'),
            'pickup_date' => $this->pickup_date?->format('Y-m-d'),
            'return_date' => $this->return_date?->format('Y-m-d'),
            'vehicle_preference' => $this->vehicle_preference,
            'message' => $this->message,
            'admin_notes' => $this->admin_notes,
            'admin_base_price' => $this->admin_base_price,
            'requested_addon_ids' => $this->requested_addon_ids,
            'status' => $this->status?->value,
            'quote_token' => $this->quote_token,
            'token_expires_at' => $this->token_expires_at?->toISOString(),
            'contacted_at' => $this->contacted_at?->toISOString(),
            'quoted_at' => $this->quoted_at?->toISOString(),
            'sent_at' => $this->sent_at?->toISOString(),
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'pricing' => $pricing,

            // Conflict / identity resolution fields
            'conflict_type' => $this->conflict_type,
            'pending_customer_data' => $this->pending_customer_data,
            'conflicting_customer_id' => $this->conflicting_customer_id,

            // Foreign keys
            'vehicle_id' => $this->vehicle_id,
            'customer_id' => $this->customer_id,
            'branch_id' => $this->branch_id,
            'pickup_location_id' => $this->pickup_location_id,
            'converted_rental_id' => $this->converted_rental_id,

            // Relationships
            'vehicle' => $this->whenLoaded('vehicle', fn () => [
                'id' => $this->vehicle->id,
                'name' => $this->vehicle->name,
                'license_plate' => $this->vehicle->license_plate,
                'daily_rate' => $this->vehicle->daily_rate,
                'price_visible' => (bool) $this->vehicle->price_visible,
                'thumbnail' => $this->vehicle->getFirstMediaUrl('images', 'thumb') ?: null,
                'category' => $this->vehicle->relationLoaded('category') && $this->vehicle->category
                    ? ['id' => $this->vehicle->category->id, 'name' => $this->vehicle->category->name]
                    : null,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone,
                'alt_phone' => $this->customer->alt_phone,
                'license_number' => $this->customer->license_number,
                'license_expiry_date' => $this->customer->license_expiry_date?->format('Y-m-d'),
                'id_type' => is_object($this->customer->id_type) ? $this->customer->id_type->value : $this->customer->id_type,
                'id_number' => $this->customer->id_number,
            ] : null),
            'pickup_location' => $this->whenLoaded('pickupLocation', fn () => [
                'id' => $this->pickupLocation->id,
                'name' => $this->pickupLocation->name,
            ]),
            'converted_rental' => $this->whenLoaded('convertedRental', fn () => [
                'id' => $this->convertedRental->id,
                'reference' => $this->convertedRental->reference,
                'status' => $this->convertedRental->status?->value,
            ]),
            'conflicting_customer' => $this->whenLoaded('conflictingCustomer', fn () => $this->conflictingCustomer ? [
                'id' => $this->conflictingCustomer->id,
                'name' => $this->conflictingCustomer->name,
                'email' => $this->conflictingCustomer->email,
                'phone' => $this->conflictingCustomer->phone,
                'license_number' => $this->conflictingCustomer->license_number,
                'profile_status' => $this->conflictingCustomer->profile_status?->value,
            ] : null),
        ];
    }
}
