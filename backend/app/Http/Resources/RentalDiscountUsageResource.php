<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RentalDiscountUsageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'rental_id' => $this->rental_id,
            'discount_rule_id' => $this->discount_rule_id,
            'applied_by' => $this->applied_by,
            'discount_type' => $this->discount_type,
            'amount' => (float) $this->amount,
            'note' => $this->note,
            'discount_rule' => $this->whenLoaded('discountRule', fn () => $this->discountRule ? [
                'id' => $this->discountRule->id,
                'name' => $this->discountRule->name,
                'discount_type' => $this->discountRule->discount_type?->value,
            ] : null),
            'applied_by_user' => $this->whenLoaded('appliedBy', fn () => $this->appliedBy ? [
                'id' => $this->appliedBy->id,
                'name' => $this->appliedBy->name,
            ] : null),
            'rental' => $this->whenLoaded('rental', fn () => $this->rental ? [
                'id' => $this->rental->id,
                'reference' => $this->rental->reference,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
