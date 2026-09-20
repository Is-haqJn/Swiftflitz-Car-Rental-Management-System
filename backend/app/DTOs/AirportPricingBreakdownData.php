<?php

namespace App\DTOs;

readonly class AirportPricingBreakdownData
{
    public function __construct(
        public float $packageRate,
        public float $areaCharge,
        public float $subtotal,
        public float $vatRate,
        public float $vatAmount,
        public float $couponDiscount,
        public float $total,
    ) {}

    public function toSnapshot(): array
    {
        return [
            'package_rate_snapshot' => $this->packageRate,
            'area_charge_snapshot' => $this->areaCharge,
            'vat_rate_snapshot' => $this->vatRate,
            'vat_amount' => $this->vatAmount,
            'coupon_discount_snapshot' => $this->couponDiscount,
            'total_amount' => $this->total,
        ];
    }
}
