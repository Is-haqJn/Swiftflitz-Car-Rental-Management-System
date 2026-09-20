<?php

namespace App\DTOs;

readonly class ChauffeurPricingBreakdownData
{
    public function __construct(
        public float $basePrice,
        public float $pickupCharge,
        public float $subtotal,
        public float $vatRate,
        public float $vatAmount,
        public float $couponDiscount,
        public float $total,
    ) {}

    public function toSnapshot(): array
    {
        return [
            'base_price_snapshot' => $this->basePrice,
            'pickup_charge_snapshot' => $this->pickupCharge,
            'vat_rate_snapshot' => $this->vatRate,
            'vat_amount' => $this->vatAmount,
            'coupon_discount_snapshot' => $this->couponDiscount,
            'total_amount' => $this->total,
        ];
    }
}
