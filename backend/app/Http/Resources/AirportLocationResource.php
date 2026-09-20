<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AirportLocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_type' => $this->location_type,
            'airport_id' => $this->airport_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'has_charge' => $this->has_charge,
            'charge_amount' => $this->charge_amount,
            'is_active' => $this->is_active,
            'airport' => new AirportResource($this->whenLoaded('airport')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
