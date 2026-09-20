<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DiscountCouponResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'coupon_type' => $this->coupon_type?->value,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type?->value,
            'value' => (float) $this->value,
            'valid_days' => $this->valid_days,
            'expires_at' => $this->expires_at?->toISOString(),
            'max_uses' => $this->max_uses,
            'max_uses_per_customer' => $this->max_uses_per_customer,
            'used_count' => $this->used_count,
            'min_rental_days' => $this->min_rental_days,
            'min_rental_amount' => $this->min_rental_amount !== null ? (float) $this->min_rental_amount : null,
            'is_auto_generated' => $this->is_auto_generated,
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'created_by_user' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ] : null),
            'scopes' => $this->whenLoaded('scopes', fn () => $this->scopes->map(fn ($scope) => [
                'id' => $scope->id,
                'scope_type' => $scope->scope_type?->value,
                'scope_id' => $scope->scope_id,
            ])->values()),
            'usages_count' => $this->whenCounted('usages'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
