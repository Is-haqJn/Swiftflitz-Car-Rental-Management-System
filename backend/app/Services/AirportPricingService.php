<?php

namespace App\Services;

use App\DTOs\AirportPricingBreakdownData;
use App\Enums\CouponType;
use App\Models\AirportLocation;
use App\Models\AirportPackageAssignment;
use App\Models\DiscountCoupon;
use App\Services\Contracts\AirportPricingServiceInterface;
use App\Settings\RentalSettings;

class AirportPricingService implements AirportPricingServiceInterface
{
    public function __construct(
        protected RentalSettings $rentalSettings,
    ) {}

    public function calculate(
        AirportPackageAssignment $assignment,
        AirportLocation $areaLocation,
        ?DiscountCoupon $coupon = null,
    ): AirportPricingBreakdownData {
        $packageRate = (float) $assignment->base_price;
        $areaCharge = $areaLocation->has_charge ? (float) $areaLocation->charge_amount : 0.00;
        $subtotal = $packageRate + $areaCharge;

        $couponDiscount = 0.00;
        if ($coupon !== null) {
            $couponDiscount = $coupon->type === CouponType::Percentage
                ? round($subtotal * $coupon->value / 100, 2)
                : round(min((float) $coupon->value, $subtotal), 2);
        }

        $airport = $assignment->airport ?? $assignment->load('airport')->airport;
        $vatRate = $this->rentalSettings->vat_enabled
            ? ($airport?->vat_rate !== null
                ? (float) $airport->vat_rate
                : (float) $this->rentalSettings->vat_rate)
            : 0.0;

        $discountedSubtotal = $subtotal - $couponDiscount;
        $vatAmount = $vatRate > 0 ? round($discountedSubtotal * $vatRate / 100, 2) : 0.0;
        $total = round($discountedSubtotal + $vatAmount, 2);

        return new AirportPricingBreakdownData(
            packageRate: $packageRate,
            areaCharge: $areaCharge,
            subtotal: $subtotal,
            vatRate: $vatRate,
            vatAmount: $vatAmount,
            couponDiscount: $couponDiscount,
            total: max(0.00, $total),
        );
    }
}
