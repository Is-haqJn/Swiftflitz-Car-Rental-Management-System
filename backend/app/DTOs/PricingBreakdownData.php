<?php

namespace App\DTOs;

readonly class PricingBreakdownData
{
    public function __construct(
        public int $rentalDays,
        public float $dailyRate,
        public float $base,
        public float $addonTotal,
        public array $addonBreakdown,
        public float $locationTotal,
        public array $locationBreakdown,
        public float $subtotal,
        public float $ruleDiscountAmount,
        public float $couponDiscountAmount,
        public float $manualDiscountAmount,
        public ?string $manualDiscountReason,
        public float $totalDiscountAmount,
        public float $discountedSubtotal,
        public float $taxAmount,
        public float $totalAmount,
        public float $depositAmount,
        public array $breakdown,
        public string $currency = '',
        public string $currencySymbol = '',
        public ?float $exchangeRate = null,
        public ?float $totalAmountGlobal = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            rentalDays: $data['rental_days'],
            dailyRate: $data['daily_rate'],
            base: $data['base'],
            addonTotal: $data['addon_total'],
            addonBreakdown: $data['addon_breakdown'] ?? [],
            locationTotal: $data['location_total'],
            locationBreakdown: $data['location_breakdown'] ?? [],
            subtotal: $data['subtotal'],
            ruleDiscountAmount: $data['rule_discount_amount'],
            couponDiscountAmount: $data['coupon_discount_amount'],
            manualDiscountAmount: $data['manual_discount_amount'],
            manualDiscountReason: $data['manual_discount_reason'] ?? null,
            totalDiscountAmount: $data['total_discount_amount'],
            discountedSubtotal: $data['discounted_subtotal'],
            taxAmount: $data['tax_amount'],
            totalAmount: $data['total_amount'],
            depositAmount: $data['deposit_amount'],
            breakdown: $data['breakdown'] ?? [],
        );
    }

    public function toArray(): array
    {
        return [
            'rental_days' => $this->rentalDays,
            'daily_rate' => $this->dailyRate,
            'base' => $this->base,
            'addon_total' => $this->addonTotal,
            'addon_breakdown' => $this->addonBreakdown,
            'location_total' => $this->locationTotal,
            'location_breakdown' => $this->locationBreakdown,
            'subtotal' => $this->subtotal,
            'rule_discount_amount' => $this->ruleDiscountAmount,
            'coupon_discount_amount' => $this->couponDiscountAmount,
            'manual_discount_amount' => $this->manualDiscountAmount,
            'manual_discount_reason' => $this->manualDiscountReason,
            'total_discount_amount' => $this->totalDiscountAmount,
            'discounted_subtotal' => $this->discountedSubtotal,
            'tax_amount' => $this->taxAmount,
            'total_amount' => $this->totalAmount,
            'deposit_amount' => $this->depositAmount,
            'breakdown' => $this->breakdown,
        ];
    }
}
