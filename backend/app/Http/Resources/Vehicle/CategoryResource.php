<?php

namespace App\Http\Resources\Vehicle;

use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        $image = $this->getFirstMedia('image');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'security_deposit' => $this->security_deposit !== null ? (float) $this->security_deposit : null,
            'young_driver_age_threshold' => $this->young_driver_age_threshold,
            'young_driver_deposit' => $this->young_driver_deposit !== null ? (float) $this->young_driver_deposit : null,
            'cancellation_fee' => $this->cancellation_fee !== null ? (float) $this->cancellation_fee : null,
            'before_pickup_cancellation_fee' => $this->before_pickup_cancellation_fee !== null ? (float) $this->before_pickup_cancellation_fee : null,
            'after_pickup_cancellation_fee' => $this->after_pickup_cancellation_fee !== null ? (float) $this->after_pickup_cancellation_fee : null,
            'overdue_fee' => $this->overdue_fee !== null ? (float) $this->overdue_fee : null,
            'icon' => $this->icon,
            'is_active' => $this->is_active,
            'vehicles_count' => $this->whenCounted('vehicles'),
            'image' => $image ? [
                'id' => $image->id,
                'file_name' => $image->file_name,
                'mime_type' => $image->mime_type,
                'size' => $image->size,
                'urls' => [
                    'original' => $image->getUrl(),
                    'large' => $image->getUrl('large'),
                    'medium' => $image->getUrl('medium'),
                    'thumb' => $image->getUrl('thumb'),
                ],
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
