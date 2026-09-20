<?php

namespace App\Services\Contracts;

use App\DTOs\ChauffeurPricingBreakdownData;
use App\Models\ChauffeurBooking;
use App\Models\ChauffeurLocation;
use App\Models\DiscountCoupon;
use App\Models\FleetServiceAssignment;
use Carbon\CarbonInterface;

interface ChauffeurPricingServiceInterface
{
    public function calculate(FleetServiceAssignment $assignment, ?ChauffeurLocation $pickupLocation, ?DiscountCoupon $coupon = null): ChauffeurPricingBreakdownData;

    /** Returns [overtime_hours, overtime_charge] or [0, 0] if within grace. */
    public function calculateOvertime(ChauffeurBooking $booking, CarbonInterface $actualReturnTime): array;
}
