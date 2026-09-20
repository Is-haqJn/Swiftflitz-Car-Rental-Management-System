<?php

namespace App\Services;

use App\DTOs\ChauffeurPricingBreakdownData;
use App\Enums\CouponType;
use App\Models\ChauffeurBooking;
use App\Models\ChauffeurLocation;
use App\Models\DiscountCoupon;
use App\Models\FleetServiceAssignment;
use App\Services\Contracts\ChauffeurPricingServiceInterface;
use App\Settings\ChauffeurSettings;
use App\Settings\RentalSettings;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class ChauffeurPricingService implements ChauffeurPricingServiceInterface
{
    public function __construct(
        protected RentalSettings $rentalSettings,
        protected ChauffeurSettings $chauffeurSettings,
    ) {}

    public function calculate(FleetServiceAssignment $assignment, ?ChauffeurLocation $pickupLocation, ?DiscountCoupon $coupon = null): ChauffeurPricingBreakdownData
    {
        $basePrice = (float) $assignment->base_price;
        $pickupCharge = $pickupLocation && $pickupLocation->charge !== null
            ? (float) $pickupLocation->charge
            : 0.00;

        $subtotal = $basePrice + $pickupCharge;

        $couponDiscount = 0.00;
        if ($coupon !== null) {
            $couponDiscount = $coupon->type === CouponType::Percentage
                ? round($subtotal * $coupon->value / 100, 2)
                : round(min((float) $coupon->value, $subtotal), 2);
        }

        $vatRate = $this->rentalSettings->vat_enabled ? (float) $this->rentalSettings->vat_rate : 0.0;
        $discountedSubtotal = $subtotal - $couponDiscount;
        $vatAmount = $vatRate > 0 ? round($discountedSubtotal * $vatRate / 100, 2) : 0.0;
        $total = round($discountedSubtotal + $vatAmount, 2);

        return new ChauffeurPricingBreakdownData(
            basePrice: $basePrice,
            pickupCharge: $pickupCharge,
            subtotal: $subtotal,
            vatRate: $vatRate,
            vatAmount: $vatAmount,
            couponDiscount: $couponDiscount,
            total: max(0.00, $total),
        );
    }

    public function calculateOvertime(ChauffeurBooking $booking, CarbonInterface $actualReturnTime): array
    {
        $scheduledReturn = Carbon::parse($booking->return_time);
        $gracePeriodEnd = $scheduledReturn->copy()->addMinutes($this->chauffeurSettings->grace_period_minutes);

        if ($actualReturnTime->lessThanOrEqualTo($gracePeriodEnd)) {
            return [0, 0.00];
        }

        $overtimeMinutes = $actualReturnTime->diffInMinutes($scheduledReturn);
        $overtimeHours = (float) ceil($overtimeMinutes / 60);
        $overtimeCharge = round($overtimeHours * (float) $this->chauffeurSettings->overtime_charge_per_hour, 2);

        return [$overtimeHours, $overtimeCharge];
    }
}
