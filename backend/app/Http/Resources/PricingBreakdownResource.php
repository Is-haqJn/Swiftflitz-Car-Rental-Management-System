<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PricingBreakdownResource extends JsonResource
{
    public function toArray($request): array
    {
        /** @var \App\DTOs\PricingBreakdownData $this */
        return [
            'rentalDays' => $this->rentalDays,
            'dailyRate' => $this->dailyRate,
            'base' => $this->base,
            'addonTotal' => $this->addonTotal,
            'addonBreakdown' => $this->addonBreakdown,
            'locationTotal' => $this->locationTotal,
            'locationBreakdown' => $this->locationBreakdown,
            'subtotal' => $this->subtotal,
            'ruleDiscountAmount' => $this->ruleDiscountAmount,
            'couponDiscountAmount' => $this->couponDiscountAmount,
            'manualDiscountAmount' => $this->manualDiscountAmount,
            'manualDiscountReason' => $this->manualDiscountReason,
            'totalDiscountAmount' => $this->totalDiscountAmount,
            'discountedSubtotal' => $this->discountedSubtotal,
            'taxAmount' => $this->taxAmount,
            'totalAmount' => $this->totalAmount,
            'depositAmount' => $this->depositAmount,
            'breakdown' => $this->breakdown,
            'currency' => $this->currency,
            'currency_symbol' => $this->currencySymbol,
            'exchange_rate' => $this->exchangeRate,
            'total_amount_global' => $this->totalAmountGlobal,
        ];
    }
}
