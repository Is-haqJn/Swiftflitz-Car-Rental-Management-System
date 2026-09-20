<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CouponUsageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'coupon_id' => $this->coupon_id,
            'customer_id' => $this->customer_id,
            'rental_id' => $this->rental_id,
            'used_at' => $this->used_at?->toISOString(),
            'coupon' => $this->whenLoaded('coupon', fn () => new DiscountCouponResource($this->coupon)),
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
