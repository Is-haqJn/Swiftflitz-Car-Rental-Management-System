<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DiscountRuleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'currency_symbol' => $this->branch->currency_symbol,
            ] : null),
            'name' => $this->name,
            'description' => $this->description,
            'discount_type' => $this->discount_type?->value,
            'discount_value' => (float) $this->discount_value,
            'condition_type' => $this->condition_type?->value,
            'condition_value' => $this->condition_value,
            'condition_vehicle' => $this->whenLoaded('conditionVehicle', fn () => $this->conditionVehicle ? [
                'id' => $this->conditionVehicle->id,
                'name' => $this->conditionVehicle->name,
                'license_plate' => $this->conditionVehicle->license_plate,
            ] : null),
            'condition_category' => $this->whenLoaded('conditionCategory', fn () => $this->conditionCategory ? [
                'id' => $this->conditionCategory->id,
                'name' => $this->conditionCategory->name,
            ] : null),
            'is_stackable' => $this->is_stackable,
            'is_active' => $this->is_active,
            'valid_from' => $this->valid_from?->toDateString(),
            'valid_to' => $this->valid_to?->toDateString(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
