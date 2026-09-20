<?php

namespace App\Http\Resources;

use App\Settings\RentalSettings;
use App\Support\CurrencyHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AirportPackageAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $currencyInfo = $this->additional['currency_info'] ?? null;
        $rate = $currencyInfo['rate'] ?? null;
        $basePrice = (float) ($this->base_price ?? 0);

        return [
            'id' => $this->id,
            'package_id' => $this->package_id,
            'airport_id' => $this->airport_id,
            'base_price' => $this->base_price,
            'is_active' => $this->is_active,
            'currency' => $currencyInfo['code'] ?? ($this->additional['global_currency'] ?? null),
            'currency_symbol' => $currencyInfo['symbol'] ?? ($this->additional['global_currency_symbol'] ?? null),
            'exchange_rate' => $rate,
            'show_converted_price' => $this->additional['show_converted'] ?? false,
            'global_currency' => $this->additional['global_currency'] ?? null,
            'global_currency_symbol' => $this->additional['global_currency_symbol'] ?? null,
            'base_price_global' => $rate !== null ? CurrencyHelper::convertToGlobal($basePrice, $rate) : null,
            'vat_rate' => $this->whenLoaded('airport', function () {
                return $this->airport->vat_rate !== null
                    ? (float) $this->airport->vat_rate
                    : (float) resolve(RentalSettings::class)->vat_rate;
            }),
            'vat_inclusive_price' => $this->whenLoaded('airport', function () {
                $vatRate = $this->airport->vat_rate !== null
                    ? (float) $this->airport->vat_rate
                    : (float) resolve(RentalSettings::class)->vat_rate;

                return round((float) $this->base_price * (1 + $vatRate / 100), 2);
            }),
            'package' => new AirportPackageResource($this->whenLoaded('package')),
            'airport' => new AirportResource($this->whenLoaded('airport')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
