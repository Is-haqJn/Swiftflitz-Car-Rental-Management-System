<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RentalLocationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'currency_symbol' => $this->branch->currency_symbol,
                'exchange_rate' => $this->branch->exchange_rate,
            ]),
            'name' => $this->name,
            'pickup_charge' => $this->pickup_charge !== null ? (float) $this->pickup_charge : null,
            'dropoff_charge' => $this->dropoff_charge !== null ? (float) $this->dropoff_charge : null,
            'is_default' => $this->is_default,
            'is_pickup' => $this->is_pickup,
            'is_dropoff' => $this->is_dropoff,
            'is_chauffeur' => $this->is_chauffeur,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
