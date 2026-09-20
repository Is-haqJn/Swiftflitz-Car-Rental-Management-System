<?php

namespace App\Http\Resources;

use App\Http\Resources\Vehicle\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FleetServiceAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_id' => $this->vehicle_id,
            'service_type' => $this->service_type,
            'package_id' => $this->package_id,
            'category_id' => $this->category_id,
            'base_price' => $this->base_price !== null ? (float) $this->base_price : null,
            'is_active' => $this->is_active,
            'package' => new AirportPackageResource($this->whenLoaded('package')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
