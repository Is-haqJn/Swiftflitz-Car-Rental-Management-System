<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChauffeurCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'expected_destination' => $this->expected_destination,
            'bookings_count' => $this->bookings_count ?? 0,
            'bookings' => $this->whenLoaded('bookings', fn () => ChauffeurBookingResource::collection($this->bookings)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
