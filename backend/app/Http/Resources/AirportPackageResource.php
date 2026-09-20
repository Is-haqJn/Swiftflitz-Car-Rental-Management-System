<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AirportPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'features' => $this->features,
            'is_available_for_pickup' => $this->is_available_for_pickup,
            'is_available_for_dropoff' => $this->is_available_for_dropoff,
            'auto_assign_vehicle' => $this->auto_assign_vehicle,
            'is_active' => $this->is_active,
            'assignments_count' => $this->whenCounted('assignments'),
            'package_photo' => $this->getFirstMedia('package_photo') ? [
                'urls' => [
                    'original' => $this->getFirstMediaUrl('package_photo'),
                    'thumb' => $this->getFirstMediaUrl('package_photo', 'thumb'),
                    'medium' => $this->getFirstMediaUrl('package_photo', 'medium'),
                ],
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
