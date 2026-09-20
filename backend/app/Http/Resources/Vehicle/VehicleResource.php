<?php

namespace App\Http\Resources\Vehicle;

use App\Http\Resources\BranchResource;
use App\Settings\PricingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pricingSettings = app(PricingSettings::class);

        $this->loadMissing('category');

        $resolvedThreshold = $this->young_driver_age_threshold
            ?? $this->category?->young_driver_age_threshold
            ?? $pricingSettings->global_young_driver_age_threshold;

        $resolvedYoungDeposit = $this->young_driver_deposit
            ?? $this->category?->young_driver_deposit
            ?? $pricingSettings->global_young_driver_deposit;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'roadworthy_expiry_date' => $this->roadworthy_expiry_date->format('Y-m-d'),
            'insurance_expiry_date' => $this->insurance_expiry_date->format('Y-m-d'),
            'license_plate' => $this->license_plate,
            'vin' => $this->vin,
            'color' => $this->color,
            'seats' => $this->seats,
            'fuel_type' => $this->fuel_type,
            'engine_size' => $this->engine_size,
            'odometer' => $this->odometer,
            'has_insurance' => $this->has_insurance,
            'has_roadworthy' => $this->has_roadworthy,
            'transmission' => $this->transmission,
            'features' => $this->features,

            // Pricing - cast to float so JSON gets numbers, not decimal strings
            'daily_rate' => (float) $this->daily_rate,
            'security_deposit' => $this->security_deposit !== null ? (float) $this->security_deposit : null,
            'price_visible' => $this->price_visible,
            'young_driver_age_threshold' => $this->young_driver_age_threshold !== null ? (int) $this->young_driver_age_threshold : null,
            'young_driver_deposit' => $this->young_driver_deposit !== null ? (float) $this->young_driver_deposit : null,
            'resolved_young_driver_age_threshold' => $resolvedThreshold !== null ? (int) $resolvedThreshold : null,
            'resolved_young_driver_deposit' => $resolvedYoungDeposit !== null ? (float) $resolvedYoungDeposit : null,

            // Status
            'status' => $this->status,
            'is_booked' => ($this->active_booking_count ?? 0) > 0,
            'description' => $this->description,
            'condition_notes' => $this->condition_notes,
            'is_featured' => $this->is_featured,

            // Branch
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),

            // Relationships
            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => VehicleImageResource::collection($this->whenLoaded('media')),

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
