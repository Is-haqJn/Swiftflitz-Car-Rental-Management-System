<?php

namespace App\Http\Resources;

use App\Settings\GeneralSettings;
use Illuminate\Http\Resources\Json\JsonResource;

class AdditionalChargeResource extends JsonResource
{
    public function toArray($request): array
    {
        $hasBranchCurrency = $this->branch_id !== null
            && $this->relationLoaded('branch')
            && $this->branch?->exchange_rate !== null;

        $generalSettings = app(GeneralSettings::class);

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'currency' => $this->branch->currency,
                'currency_symbol' => $this->branch->exchange_rate !== null
                    ? $this->branch->currency_symbol
                    : $generalSettings->currency_symbol,
            ] : null),
            'currency' => $hasBranchCurrency
                ? $this->branch->currency
                : $generalSettings->currency,
            'currency_symbol' => $hasBranchCurrency
                ? $this->branch->currency_symbol
                : $generalSettings->currency_symbol,
            'name' => $this->name,
            'description' => $this->description,
            'scope' => $this->scope?->value,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'vehicle_id' => $this->vehicle_id,
            'vehicle' => $this->whenLoaded('vehicle', fn () => $this->vehicle ? [
                'id' => $this->vehicle->id,
                'name' => $this->vehicle->name,
                'license_plate' => $this->vehicle->license_plate,
            ] : null),
            'charge_type' => $this->charge_type?->value,
            'amount' => (float) $this->amount,
            'stock_quantity' => $this->stock_quantity,
            'is_waivable' => $this->is_waivable,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
