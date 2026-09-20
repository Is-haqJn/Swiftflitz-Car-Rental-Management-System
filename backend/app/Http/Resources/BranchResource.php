<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'currency' => $this->currency,
            'currency_symbol' => $this->currency_symbol,
            'exchange_rate' => $this->exchange_rate !== null ? (float) $this->exchange_rate : null,
            'show_converted_price' => (bool) $this->show_converted_price,
            'has_airport_service' => $this->has_airport_service,
            'airport_id' => $this->airport_id,
            'airport' => new AirportResource($this->whenLoaded('airport')),
            'managers' => UserResource::collection($this->whenLoaded('managers')),
            'vehicles_count' => $this->vehicles_count ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
