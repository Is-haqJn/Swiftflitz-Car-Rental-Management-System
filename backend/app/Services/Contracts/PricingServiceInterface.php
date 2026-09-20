<?php

namespace App\Services\Contracts;

use App\DTOs\PricingBreakdownData;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Vehicle;
use Carbon\CarbonInterface;

interface PricingServiceInterface
{
    public function calculate(
        Vehicle $vehicle,
        string $pickupDate,
        string $returnDate,
        ?Customer $customer = null,
        array $addons = [],
        ?string $pickupLocationId = null,
        ?string $dropoffLocationId = null,
        ?string $couponCode = null,
        float $manualDiscount = 0.0,
        ?string $manualDiscountReason = null,
        ?int $customerAge = null,
        bool $skipDeposit = false,
        ?float $overrideBaseCost = null,
        ?Branch $bookingBranch = null,
        ?bool $youngDriverOverride = null,
    ): PricingBreakdownData;

    public function calculateOverdue(mixed $rental, CarbonInterface $actualReturnTime): ?array;

    public function calculateCancellation(mixed $rental): array;

    public function calculateSwapAdjustment(mixed $rental, Vehicle $newVehicle, CarbonInterface $swapDate): array;

    public function calculateEarlyReturn(mixed $rental, CarbonInterface $returnDate): array;
}
