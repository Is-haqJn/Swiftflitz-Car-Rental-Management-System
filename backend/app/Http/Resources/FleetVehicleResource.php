<?php

namespace App\Http\Resources;

use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FleetVehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'default_driver_id' => $this->default_driver_id,
            'is_personal_vehicle' => $this->is_personal_vehicle,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'color' => $this->color,
            'license_plate' => $this->license_plate,
            'seats' => $this->seats,
            'transmission' => $this->transmission,
            'fuel_type' => $this->fuel_type,
            'engine' => $this->engine,
            'features' => $this->features ?? [],
            'has_insurance' => $this->has_insurance,
            'insurance_expiry_date' => $this->insurance_expiry_date?->toDateString(),
            'has_roadworthy' => $this->has_roadworthy,
            'roadworthy_expiry_date' => $this->roadworthy_expiry_date?->toDateString(),
            'status' => $this->status,
            'is_active' => $this->is_active,
            'name' => $this->name,
            'is_featured' => $this->is_featured,
            'chauffeur_base_price' => $this->whenLoaded('serviceAssignments', function () {
                $assignment = $this->serviceAssignments->firstWhere('service_type', 'chauffeur');

                return $assignment ? (float) $assignment->base_price : null;
            }),
            'currency_symbol' => $this->whenLoaded('branch', fn () => $this->branch?->currency_symbol),
            'global_currency_symbol' => app(GeneralSettings::class)->currency_symbol,
            'description' => $this->description,
            'notes' => $this->notes,
            'insurance_expired' => $this->insurance_expired,
            'insurance_expires_soon' => $this->insurance_expires_soon,
            'roadworthy_expired' => $this->roadworthy_expired,
            'roadworthy_expires_soon' => $this->roadworthy_expires_soon,
            'default_driver' => new DriverResource($this->whenLoaded('defaultDriver')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'service_assignments' => FleetServiceAssignmentResource::collection($this->whenLoaded('serviceAssignments')),
            'photos' => $this->getMedia('photos')->map(fn ($media) => [
                'id' => $media->id,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'urls' => [
                    'original' => $media->getFullUrl(),
                    'large' => $media->hasGeneratedConversion('large') ? $media->getFullUrl('large') : $media->getFullUrl(),
                    'medium' => $media->hasGeneratedConversion('medium') ? $media->getFullUrl('medium') : $media->getFullUrl(),
                    'thumb' => $media->hasGeneratedConversion('thumb') ? $media->getFullUrl('thumb') : $media->getFullUrl(),
                ],
            ])->values(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
