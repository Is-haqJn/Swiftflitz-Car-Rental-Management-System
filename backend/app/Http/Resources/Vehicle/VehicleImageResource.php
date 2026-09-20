<?php

namespace App\Http\Resources\Vehicle;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'urls' => [
                'original' => $this->getUrl(),
                'large' => $this->getUrl('large'),
                'medium' => $this->getUrl('medium'),
                'thumb' => $this->getUrl('thumb'),
            ],
            'sort_order' => $this->order_column,
            'is_primary' => $this->getCustomProperty('is_primary', false),
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
