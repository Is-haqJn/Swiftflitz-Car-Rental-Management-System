<?php

namespace App\Services\Contracts;

use App\DTOs\AirportPricingBreakdownData;
use App\Models\AirportLocation;
use App\Models\AirportPackageAssignment;
use App\Models\DiscountCoupon;

interface AirportPricingServiceInterface
{
    public function calculate(
        AirportPackageAssignment $assignment,
        AirportLocation $areaLocation,
        ?DiscountCoupon $coupon = null,
    ): AirportPricingBreakdownData;
}
