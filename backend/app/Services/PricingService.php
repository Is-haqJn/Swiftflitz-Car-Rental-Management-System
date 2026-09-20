<?php

namespace App\Services;

use App\DTOs\PricingBreakdownData;
use App\Enums\ChargeScope;
use App\Enums\ChargeType;
use App\Enums\CouponType;
use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use App\Models\AdditionalCharge;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\DiscountRule;
use App\Models\RentalLocation;
use App\Models\Vehicle;
use App\Services\Contracts\DiscountCouponServiceInterface;
use App\Services\Contracts\PricingServiceInterface;
use App\Settings\CancellationSettings;
use App\Settings\EarlyReturnSettings;
use App\Settings\GeneralSettings;
use App\Settings\OverdueSettings;
use App\Settings\PricingSettings;
use App\Settings\RentalSettings;
use App\Support\CurrencyHelper;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;
use Throwable;

class PricingService implements PricingServiceInterface
{
    public function __construct(
        protected RentalSettings $rentalSettings,
        protected PricingSettings $pricingSettings,
        protected OverdueSettings $overdueSettings,
        protected CancellationSettings $cancellationSettings,
        protected EarlyReturnSettings $earlyReturnSettings,
        protected DiscountCouponServiceInterface $couponService,
        protected GeneralSettings $generalSettings,
    ) {}

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
    ): PricingBreakdownData {
        // 1. Rental days
        $rentalDays = $this->getRentalDays($pickupDate, $returnDate);

        // Resolve branch currency early so charge methods can convert global charges
        $vehicle->loadMissing('branch');
        $vehicleCurrencyInfo = CurrencyHelper::resolveForBranch($vehicle->branch, $this->generalSettings);
        $currencyInfo = $vehicleCurrencyInfo;

        /* When the vehicle's branch has no custom currency (e.g. a GHS vehicle used in a
         * cross-branch booking), fall back to the explicitly selected booking branch for the
         * currency label (code, symbol, exchange_rate). Amounts are NOT FX-converted in this
         * path - stored values are treated as native to the booking branch's currency. */
        if (! $currencyInfo['is_custom'] && $bookingBranch !== null) {
            $bookingCurrencyInfo = CurrencyHelper::resolveForBranch($bookingBranch, $this->generalSettings);
            if ($bookingCurrencyInfo['is_custom']) {
                $currencyInfo = $bookingCurrencyInfo;
            }
        }

        /* vehicleBranchRate drives convertFromGlobal for null-branch location charges only.
         * Kept from the vehicle's own branch so amounts the admin entered in the booking
         * branch's native currency are not double-converted. */
        $vehicleBranchRate = $vehicleCurrencyInfo['rate'];

        // 2. Base cost - use admin override when provided, otherwise apply monthly/weekly/daily waterfall
        $dailyRate = (float) $vehicle->daily_rate;
        $base = $overrideBaseCost !== null
            ? round($overrideBaseCost, 2)
            : $this->getBaseCost($vehicle, $rentalDays);

        // Effective daily rate for breakdown label - reflects custom override when set
        $effectiveDailyRate = $overrideBaseCost !== null
            ? round($overrideBaseCost / $rentalDays, 2)
            : $dailyRate;

        // 3. Addon charges (user-selected) - global charges converted to vehicle branch currency
        $addonResult = $this->getAddonCharges($addons, $rentalDays, $vehicleBranchRate);
        $addonTotal = $addonResult['total'];
        $addonBreakdown = $addonResult['items'];

        // 3b. Auto-charges - mandatory charges scoped to this vehicle, category, or globally.
        //     These are always applied regardless of user selection.
        $selectedAddonIds = array_column($addons, 'id');
        $autoResult = $this->getAutoCharges($vehicle, $rentalDays, $selectedAddonIds, $vehicleBranchRate);
        $addonTotal = round($addonTotal + $autoResult['total'], 2);
        $addonBreakdown = array_merge($addonBreakdown, $autoResult['items']);

        // 4. Location charges
        $locationResult = $this->getLocationCharges($pickupLocationId, $dropoffLocationId, $vehicleBranchRate);
        $locationTotal = $locationResult['total'];
        $locationBreakdown = $locationResult['items'];

        // 5. Subtotal
        $subtotal = round($base + $addonTotal + $locationTotal, 2);

        // 6. Rule discounts (applied against subtotal)
        $ruleDiscountAmount = round($this->applyDiscountRules($vehicle, $rentalDays, $customer, $subtotal, $pickupDate), 2);

        // 7. Coupon discount (applied against subtotal)
        $couponDiscountAmount = round($this->applyCoupon($couponCode, $customer, $rentalDays, $subtotal), 2);

        // 8. Manual discount
        $manualDiscountAmount = round(max(0.0, $manualDiscount), 2);

        // 9. Total discount
        $totalDiscountAmount = round($ruleDiscountAmount + $couponDiscountAmount + $manualDiscountAmount, 2);

        // 10. Discounted subtotal
        $discountedSubtotal = round(max(0.0, $subtotal - $totalDiscountAmount), 2);

        // 11. Tax
        $taxAmount = $this->calculateTax($discountedSubtotal);

        // 12. Total
        $totalAmount = round($discountedSubtotal + $taxAmount, 2);

        // 13. Deposit
        if ($customerAge === null && $customer?->date_of_birth !== null) {
            $customerAge = Carbon::parse($customer->date_of_birth)->age;
        }

        $depositAmount = $this->getDepositAmount($vehicle, $skipDeposit, $customerAge, $youngDriverOverride);

        // Build line-item breakdown for frontend display
        $breakdown = $this->buildBreakdown(
            rentalDays: $rentalDays,
            dailyRate: $effectiveDailyRate,
            base: $base,
            addonBreakdown: $addonBreakdown,
            locationBreakdown: $locationBreakdown,
            ruleDiscountAmount: $ruleDiscountAmount,
            couponDiscountAmount: $couponDiscountAmount,
            manualDiscountAmount: $manualDiscountAmount,
            manualDiscountReason: $manualDiscountReason,
            taxAmount: $taxAmount,
            depositAmount: $depositAmount,
        );

        $totalAmountGlobal = $currencyInfo['rate'] !== null
            ? CurrencyHelper::convertToGlobal($totalAmount, $currencyInfo['rate'])
            : null;

        return new PricingBreakdownData(
            rentalDays: $rentalDays,
            dailyRate: $effectiveDailyRate,
            base: $base,
            addonTotal: $addonTotal,
            addonBreakdown: $addonBreakdown,
            locationTotal: $locationTotal,
            locationBreakdown: $locationBreakdown,
            subtotal: $subtotal,
            ruleDiscountAmount: $ruleDiscountAmount,
            couponDiscountAmount: $couponDiscountAmount,
            manualDiscountAmount: $manualDiscountAmount,
            manualDiscountReason: $manualDiscountReason,
            totalDiscountAmount: $totalDiscountAmount,
            discountedSubtotal: $discountedSubtotal,
            taxAmount: $taxAmount,
            totalAmount: $totalAmount,
            depositAmount: $depositAmount,
            breakdown: $breakdown,
            currency: $currencyInfo['code'],
            currencySymbol: $currencyInfo['symbol'],
            exchangeRate: $currencyInfo['rate'],
            totalAmountGlobal: $totalAmountGlobal,
        );
    }

    public function getRentalDays(string $pickupDate, string $returnDate): int
    {
        $pickup = Carbon::parse($pickupDate)->startOfDay();
        $return = Carbon::parse($returnDate)->startOfDay();
        $days = (int) $pickup->diffInDays($return);

        if ($days < 1) {
            throw ValidationException::withMessages([
                'return_date' => ['Return date must be at least 1 day after pickup date.'],
            ]);
        }

        $minDays = $this->rentalSettings->min_rental_days ?? 1;
        $maxDays = $this->rentalSettings->max_rental_days ?? 365;

        if ($days < $minDays) {
            throw ValidationException::withMessages([
                'return_date' => ["Minimum rental period is {$minDays} day(s)."],
            ]);
        }

        if ($maxDays > 0 && $days > $maxDays) {
            throw ValidationException::withMessages([
                'return_date' => ["Maximum rental period is {$maxDays} day(s)."],
            ]);
        }

        return $days;
    }

    public function getBaseCost(Vehicle $vehicle, int $rentalDays): float
    {
        $rate = (float) $vehicle->daily_rate;

        if ($rate <= 0) {
            throw ValidationException::withMessages([
                'vehicle_id' => ['This vehicle does not have a valid daily rate.'],
            ]);
        }

        return round($rate * $rentalDays, 2);
    }

    /**
     * @param  array<array{id: string, quantity: int}>  $addons
     * @param  float|null  $vehicleBranchRate  When set, global charges (branch_id=null) are converted from global to branch currency
     */
    public function getAddonCharges(array $addons, int $rentalDays, ?float $vehicleBranchRate = null): array
    {
        $total = 0.0;
        $items = [];

        $addonIds = array_column($addons, 'id');
        $charges = AdditionalCharge::whereIn('id', $addonIds)->get()->keyBy('id');

        foreach ($addons as $addon) {
            $charge = $charges->get($addon['id']);

            if (! $charge) {
                abort(422, "Addon [{$addon['id']}] not found.");
            }

            $quantity = (int) $addon['quantity'];

            // Stock check
            if ($charge->stock_quantity !== null && $charge->stock_quantity < $quantity) {
                throw ValidationException::withMessages([
                    'addons' => ["Insufficient stock for addon \"{$charge->name}\". Available: {$charge->stock_quantity}."],
                ]);
            }

            $unit = (float) $charge->amount;

            // Global charges (no branch) are stored in global currency; convert to vehicle branch currency when needed
            if ($vehicleBranchRate !== null && $charge->branch_id === null) {
                $unit = CurrencyHelper::convertFromGlobal($unit, $vehicleBranchRate);
            }

            if ($charge->charge_type === ChargeType::PerDay) {
                $amount = round($unit * $quantity * $rentalDays, 2);
            } else {
                $amount = round($unit * $quantity, 2);
            }

            $total += $amount;

            $items[] = [
                'id' => $charge->id,
                'name' => $charge->name,
                'type' => $charge->charge_type->value,
                'quantity' => $quantity,
                'days' => $charge->charge_type === ChargeType::PerDay ? $rentalDays : 1,
                'unit' => $unit,
                'amount' => $amount,
            ];
        }

        return ['total' => round($total, 2), 'items' => $items];
    }

    /**
     * Fetch mandatory auto-charges for a vehicle (Global, Category, Vehicle scoped).
     * Excludes any IDs already covered by the user's selected addons to avoid double-counting.
     *
     * @param  string[]  $excludeIds  Addon IDs already accounted for
     * @param  float|null  $vehicleBranchRate  When set, global charges (branch_id=null) are converted from global to branch currency
     * @return array{total: float, items: array<int, array<string, mixed>>}
     */
    public function getAutoCharges(Vehicle $vehicle, int $rentalDays, array $excludeIds = [], ?float $vehicleBranchRate = null): array
    {
        $total = 0.0;
        $items = [];

        $charges = AdditionalCharge::where('is_active', true)
            ->whereIn('scope', [
                ChargeScope::Global->value,
                ChargeScope::Category->value,
                ChargeScope::Vehicle->value,
            ])
            ->where(function ($q) use ($vehicle) {
                $q->where('scope', ChargeScope::Global->value)
                    ->orWhere(function ($q2) use ($vehicle) {
                        $q2->where('scope', ChargeScope::Category->value)
                            ->where('category_id', $vehicle->category_id);
                    })
                    ->orWhere(function ($q2) use ($vehicle) {
                        $q2->where('scope', ChargeScope::Vehicle->value)
                            ->where('vehicle_id', $vehicle->id);
                    });
            })
            ->when(! empty($excludeIds), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->get();

        foreach ($charges as $charge) {
            $unit = (float) $charge->amount;

            // Global charges (no branch) are stored in global currency; convert to vehicle branch currency when needed
            if ($vehicleBranchRate !== null && $charge->branch_id === null) {
                $unit = CurrencyHelper::convertFromGlobal($unit, $vehicleBranchRate);
            }

            $amount = $charge->charge_type === ChargeType::PerDay
                ? round($unit * $rentalDays, 2)
                : round($unit, 2);

            $total += $amount;

            $items[] = [
                'id' => $charge->id,
                'name' => $charge->name,
                'type' => $charge->charge_type->value,
                'quantity' => 1,
                'days' => $charge->charge_type === ChargeType::PerDay ? $rentalDays : 1,
                'unit' => $unit,
                'amount' => $amount,
                'auto' => true,
            ];
        }

        return ['total' => round($total, 2), 'items' => $items];
    }

    public function getLocationCharges(?string $pickupLocationId, ?string $dropoffLocationId, ?float $vehicleBranchRate = null): array
    {
        $total = 0.0;
        $items = [];

        if ($pickupLocationId) {
            $pickup = RentalLocation::find($pickupLocationId);

            if ($pickup && (float) $pickup->pickup_charge > 0) {
                $unit = (float) $pickup->pickup_charge;
                if ($vehicleBranchRate !== null && $pickup->branch_id === null) {
                    $unit = CurrencyHelper::convertFromGlobal($unit, $vehicleBranchRate);
                }
                $amount = round($unit, 2);
                $total += $amount;
                $items[] = ['type' => 'pickup', 'location' => $pickup->name, 'amount' => $amount];
            }
        }

        if ($dropoffLocationId && $dropoffLocationId !== $pickupLocationId) {
            $dropoff = RentalLocation::find($dropoffLocationId);

            if ($dropoff && (float) $dropoff->dropoff_charge > 0) {
                $unit = (float) $dropoff->dropoff_charge;
                if ($vehicleBranchRate !== null && $dropoff->branch_id === null) {
                    $unit = CurrencyHelper::convertFromGlobal($unit, $vehicleBranchRate);
                }
                $amount = round($unit, 2);
                $total += $amount;
                $items[] = ['type' => 'dropoff', 'location' => $dropoff->name, 'amount' => $amount];
            }
        }

        return ['total' => round($total, 2), 'items' => $items];
    }

    public function applyDiscountRules(
        Vehicle $vehicle,
        int $days,
        ?Customer $customer,
        float $subtotal,
        string $pickupDate,
    ): float {
        $vehicle->loadMissing('category');
        $now = now();

        $rules = DiscountRule::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_to')->orWhere('valid_to', '>=', $now);
            })
            ->get();

        $stackableDiscount = 0.0;
        $bestNonStackable = null;
        $bestNonStackableValue = 0.0;

        foreach ($rules as $rule) {
            if (! $this->evaluateDiscountCondition($rule, $vehicle, $days, $customer, $subtotal, $pickupDate)) {
                continue;
            }

            $discount = $this->calculateRuleDiscount($rule, $subtotal);

            if ($rule->is_stackable) {
                $stackableDiscount += $discount;
            } else {
                if ($discount > $bestNonStackableValue) {
                    $bestNonStackableValue = $discount;
                    $bestNonStackable = $rule;
                }
            }
        }

        $nonStackableDiscount = $bestNonStackable ? $bestNonStackableValue : 0.0;

        return round($stackableDiscount + $nonStackableDiscount, 2);
    }

    public function applyCoupon(
        ?string $code,
        ?Customer $customer,
        int $days,
        float $subtotal,
    ): float {
        if (! $code) {
            return 0.0;
        }

        try {
            $coupon = $this->couponService->validateCode($code, $customer?->id, 'rental');
        } catch (Throwable) {
            return 0.0;
        }

        // Check min rental days
        if ($coupon->min_rental_days !== null && $days < $coupon->min_rental_days) {
            return 0.0;
        }

        // Check min rental amount
        if ($coupon->min_rental_amount !== null && $subtotal < (float) $coupon->min_rental_amount) {
            return 0.0;
        }

        if ($coupon->type === CouponType::Percentage) {
            return round($subtotal * ((float) $coupon->value / 100), 2);
        }

        return round(min((float) $coupon->value, $subtotal), 2);
    }

    public function calculateTax(float $discountedSubtotal): float
    {
        if (! $this->rentalSettings->vat_enabled) {
            return 0.0;
        }

        return round($discountedSubtotal * ($this->rentalSettings->vat_rate / 100), 2);
    }

    public function getDepositAmount(Vehicle $vehicle, bool $skip, ?int $customerAge = null, ?bool $forceYoungDriver = null): float
    {
        if ($skip) {
            return 0.0;
        }

        $vehicle->loadMissing('category');

        $threshold = $vehicle->young_driver_age_threshold
            ?? $vehicle->category?->young_driver_age_threshold
            ?? $this->pricingSettings->global_young_driver_age_threshold;
        $youngDeposit = $vehicle->young_driver_deposit
            ?? $vehicle->category?->young_driver_deposit
            ?? $this->pricingSettings->global_young_driver_deposit;

        /* Determine young driver status.
           Priority: explicit bracket override > DOB-derived age > not young. */
        $isYoungDriver = match (true) {
            $forceYoungDriver !== null => $forceYoungDriver,
            $threshold !== null && $customerAge !== null => $customerAge < $threshold,
            default => false,
        };

        if ($isYoungDriver && $youngDeposit !== null) {
            return round((float) $youngDeposit, 2);
        }

        $deposit = $vehicle->security_deposit
            ?? $vehicle->category?->security_deposit
            ?? $this->pricingSettings->global_security_deposit
            ?? 0.0;

        return round((float) $deposit, 2);
    }

    public function calculateOverdue(mixed $rental, CarbonInterface $actualReturnTime): ?array
    {
        $scheduledReturn = Carbon::parse($rental->scheduled_return_date);

        if ($this->overdueSettings->overdue_start_type === 'grace_period') {
            $overdueStart = $scheduledReturn->copy()->addMinutes($this->overdueSettings->grace_period_minutes);
        } else {
            $overdueStart = $scheduledReturn->copy();
        }

        $overdueMinutes = max(0, $overdueStart->diffInMinutes($actualReturnTime, false));

        if ($overdueMinutes <= 0) {
            return null;
        }

        $thresholdMins = $this->overdueSettings->overdue_threshold_hours * 60;

        $vehicle = $rental->vehicle;
        $vehicle->loadMissing('category');

        $perDayAddonsCharge = 0.0;

        if ($overdueMinutes <= $thresholdMins) {
            // Hourly charge - penalty only, no per-day add-ons
            $hourlyRate = (float) ($vehicle->overdue_daily_rate
                ?? $vehicle->category?->overdue_daily_rate
                ?? $this->overdueSettings->overdue_hourly_rate);

            $units = (int) ceil($overdueMinutes / 60);
            $charge = round($hourlyRate * $units, 2);
            $type = 'hourly';
        } else {
            // Daily charge - full day assumed, include per-day add-ons
            $dailyRate = (float) $rental->daily_rate;
            $units = (int) ceil($overdueMinutes / 1440);
            $vehicleCharge = round($dailyRate * $units, 2);
            $type = 'daily';

            $perDayAddonsRate = 0.0;
            foreach ($rental->applied_charges_breakdown ?? [] as $item) {
                if (($item['type'] ?? '') === 'addon' && ($item['is_per_day'] ?? false) && isset($item['unit_rate'])) {
                    $perDayAddonsRate += (float) $item['unit_rate'];
                }
            }
            $perDayAddonsCharge = round($perDayAddonsRate * $units, 2);
            $charge = $vehicleCharge + $perDayAddonsCharge;
        }

        return [
            'overdue_minutes' => $overdueMinutes,
            'type' => $type,
            'units' => $units,
            'charge' => $charge,
            'per_day_addons_charge' => $perDayAddonsCharge,
            'can_waive' => $this->overdueSettings->allow_overdue_waive,
        ];
    }

    public function calculateCancellation(mixed $rental): array
    {
        // Already active (post-pickup)
        if (in_array($rental->status?->value ?? $rental->status, ['active', 'overdue'])) {
            $fee = $this->resolveAfterPickupCancellationFee($rental->vehicle);

            return ['fee' => $fee, 'days_used_cost' => $this->computeDaysUsedCost($rental), 'reason' => 'after_pickup'];
        }

        $hoursToPickup = max(0, now()->diffInHours(
            Carbon::parse($rental->scheduled_pickup_date), false
        ));

        // Free cancellation: more than threshold hours before pickup
        if ($hoursToPickup > $this->cancellationSettings->free_cancellation_window_hours) {
            return ['fee' => 0.0, 'days_used_cost' => 0.0, 'reason' => 'free_window'];
        }

        // Within window - before-pickup fee applies
        $fee = $this->resolveBeforePickupCancellationFee($rental->vehicle);

        return ['fee' => $fee, 'days_used_cost' => 0.0, 'reason' => 'late_cancellation'];
    }

    public function computeDaysUsedCost(mixed $rental): float
    {
        $rentalDays = (int) $rental->rental_days;

        if ($rentalDays < 1) {
            return 0.0;
        }

        $actualPickup = $rental->actual_pickup_date;

        if (! $actualPickup) {
            return 0.0;
        }

        $daysUsed = max(1, min(
            $rentalDays,
            (int) Carbon::parse($actualPickup)->startOfDay()->diffInDays(now()->startOfDay())
        ));

        $breakdown = is_array($rental->applied_charges_breakdown) ? $rental->applied_charges_breakdown : null;

        if (! $breakdown) {
            // Fallback: proportional share of total cost
            return round((float) $rental->total_cost / $rentalDays * $daysUsed, 2);
        }

        $base = (float) $rental->daily_rate * $daysUsed;
        $addonTotal = 0.0;
        $locationTotal = 0.0;
        $taxTotal = 0.0;
        $discountTotal = 0.0;

        foreach ($breakdown as $line) {
            $type = $line['type'] ?? '';
            $amount = (float) ($line['amount'] ?? 0);

            if ($type === 'base') {
                continue; // Covered by daily_rate × daysUsed above
            }

            if ($type === 'addon') {
                $isPerDay = $line['is_per_day'] ?? null;

                if ($isPerDay === null) {
                    // Old breakdown without flag - proportional fallback
                    $addonTotal += round(abs($amount) / $rentalDays * $daysUsed, 2);
                } elseif ($isPerDay) {
                    $unitRate = (float) ($line['unit_rate'] ?? 0);
                    $quantity = (int) ($line['quantity'] ?? 1);
                    $addonTotal += round($unitRate * $quantity * $daysUsed, 2);
                } else {
                    $addonTotal += abs($amount); // Flat - charge in full
                }
            }

            if ($type === 'location') {
                $locationTotal += abs($amount); // One-time fee - charge in full
            }

            if ($type === 'tax') {
                $taxTotal += round(abs($amount) / $rentalDays * $daysUsed, 2);
            }

            if ($type === 'discount') {
                // Amount is stored negative; scale proportionally
                $discountTotal += round(abs($amount) / $rentalDays * $daysUsed, 2);
            }
        }

        return round(max(0.0, $base + $addonTotal + $locationTotal + $taxTotal - $discountTotal), 2);
    }

    public function calculateSwapAdjustment(mixed $rental, Vehicle $newVehicle, CarbonInterface $swapDate): array
    {
        $returnDate = Carbon::parse($rental->scheduled_return_date);
        $remainingDays = max(1, (int) $swapDate->startOfDay()->diffInDays($returnDate->startOfDay()));

        $oldDailyRate = (float) $rental->vehicle->daily_rate;
        $newDailyRate = (float) $newVehicle->daily_rate;

        $oldRemaining = round($oldDailyRate * $remainingDays, 2);
        $newRemaining = round($newDailyRate * $remainingDays, 2);
        $adjustment = round($newRemaining - $oldRemaining, 2);

        return [
            'remaining_days' => $remainingDays,
            'old_daily_rate' => $oldDailyRate,
            'new_daily_rate' => $newDailyRate,
            'old_remaining_cost' => $oldRemaining,
            'new_remaining_cost' => $newRemaining,
            'adjustment' => $adjustment,
        ];
    }

    /**
     * Determine whether and how early return policy applies.
     *
     * @return array{
     *     saved_days: int,
     *     is_early_return: bool,
     *     below_threshold: bool,
     *     charge_applies: bool,
     *     charge_amount: float,
     *     refund_enabled: bool,
     *     days_used_cost: float,
     *     refund_amount: float,
     * }
     */
    public function calculateEarlyReturn(mixed $rental, CarbonInterface $returnDate): array
    {
        $scheduledReturn = Carbon::parse($rental->scheduled_return_date);
        $savedDays = max(0, (int) $returnDate->copy()->startOfDay()->diffInDays($scheduledReturn->startOfDay()));

        $base = [
            'saved_days' => $savedDays,
            'is_early_return' => false,
            'below_threshold' => false,
            'charge_applies' => false,
            'charge_amount' => 0.0,
            'refund_enabled' => $this->earlyReturnSettings->early_return_refund_enabled,
            'days_used_cost' => 0.0,
            'refund_amount' => 0.0,
        ];

        if ($savedDays === 0) {
            return $base;
        }

        $base['is_early_return'] = true;
        $threshold = $this->earlyReturnSettings->early_return_threshold_days;

        // Below threshold: forfeit remaining days - no charge, no refund
        if ($savedDays <= $threshold) {
            $base['below_threshold'] = true;

            return $base;
        }

        // Compute days_used_cost: what the customer actually owes for days used
        $actualDays = $rental->rental_days - $savedDays;
        $breakdown = $rental->applied_charges_breakdown ?? [];

        // Derive effective daily rate from breakdown (base + per-day addons)
        $effectiveDailyRate = 0.0;
        foreach ($breakdown as $line) {
            $type = $line['type'] ?? '';
            if ($type === 'base') {
                $effectiveDailyRate += (float) ($line['daily_rate'] ?? $line['amount'] / max(1, $rental->rental_days));
            } elseif ($type === 'addon' && ($line['billing'] ?? '') === 'per_day') {
                $effectiveDailyRate += (float) ($line['daily_rate'] ?? ($line['amount'] / max(1, $rental->rental_days)));
            }
        }

        // Fallback to vehicle daily_rate if breakdown gives nothing
        if ($effectiveDailyRate <= 0) {
            $effectiveDailyRate = (float) $rental->vehicle->daily_rate;
        }

        $daysUsedCost = round($effectiveDailyRate * max(1, $actualDays), 2);
        $base['days_used_cost'] = $daysUsedCost;

        // Resolve early return charge (if enabled)
        if ($this->earlyReturnSettings->early_return_charge_enabled) {
            $chargeAmount = 0.0;

            if ($this->earlyReturnSettings->early_return_charge_type === 'category') {
                $chargeAmount = (float) ($rental->vehicle->category->early_return_charge ?? 0.0);
            } else {
                $chargeAmount = (float) $this->earlyReturnSettings->early_return_flat_rate;
            }

            if ($chargeAmount > 0) {
                $base['charge_applies'] = true;
                $base['charge_amount'] = $chargeAmount;
            }
        }

        // Refund = what customer paid above days_used_cost + charge (settled later, not here)
        // We just return the components; RentalService does the financial reconciliation
        if ($this->earlyReturnSettings->early_return_refund_enabled) {
            $effectiveCostForCustomer = round($daysUsedCost + $base['charge_amount'], 2);
            $base['refund_amount'] = round(max(0.0, (float) $rental->total_cost - $effectiveCostForCustomer), 2);
        }

        return $base;
    }

    private function resolveBeforePickupCancellationFee(Vehicle $vehicle): float
    {
        $vehicle->loadMissing('category');
        $fee = $vehicle->category?->before_pickup_cancellation_fee
            ?? $this->cancellationSettings->before_pickup_cancellation_fee;

        return round((float) $fee, 2);
    }

    private function resolveAfterPickupCancellationFee(Vehicle $vehicle): float
    {
        $vehicle->loadMissing('category');
        $fee = $vehicle->category?->after_pickup_cancellation_fee
            ?? $this->cancellationSettings->after_pickup_cancellation_fee;

        return round((float) $fee, 2);
    }

    /* Private helpers */
    private function evaluateDiscountCondition(
        DiscountRule $rule,
        Vehicle $vehicle,
        int $days,
        ?Customer $customer,
        float $subtotal,
        string $pickupDate,
    ): bool {
        return match ($rule->condition_type) {
            DiscountConditionType::None => true,

            DiscountConditionType::RentalDurationDays => $days >= (int) $rule->condition_value,

            DiscountConditionType::DaysBeforePickup => now()
                ->startOfDay()
                ->diffInDays(Carbon::parse($pickupDate)->startOfDay()) >= (int) $rule->condition_value,

            DiscountConditionType::CustomerCompletedRentals => $customer !== null
                && $customer->rentals()->where('status', 'completed')->count() >= (int) $rule->condition_value,

            DiscountConditionType::BaseAmount => $subtotal >= (float) $rule->condition_value,

            DiscountConditionType::VehicleId => $vehicle->id === $rule->condition_value,

            DiscountConditionType::CategoryId => $vehicle->category_id === $rule->condition_value,

            DiscountConditionType::BookingSource => false, // not applicable at preview time
        };
    }

    private function calculateRuleDiscount(DiscountRule $rule, float $subtotal): float
    {
        if ($rule->discount_type === DiscountType::Percentage) {
            return round($subtotal * ((float) $rule->discount_value / 100), 2);
        }

        return round(min((float) $rule->discount_value, $subtotal), 2);
    }

    private function buildBreakdown(
        int $rentalDays,
        float $dailyRate,
        float $base,
        array $addonBreakdown,
        array $locationBreakdown,
        float $ruleDiscountAmount,
        float $couponDiscountAmount,
        float $manualDiscountAmount,
        ?string $manualDiscountReason,
        float $taxAmount,
        float $depositAmount,
    ): array {
        $lines = [];

        $lines[] = ['label' => "Base cost ({$rentalDays} day" . ($rentalDays > 1 ? 's' : '') . " × {$dailyRate})", 'amount' => $base, 'type' => 'base'];

        foreach ($addonBreakdown as $item) {
            $lines[] = [
                'id' => $item['id'],
                'label' => $item['name'],
                'amount' => $item['amount'],
                'type' => 'addon',
                'is_per_day' => $item['type'] === 'per_day',
                'unit_rate' => $item['unit'],
                'quantity' => $item['quantity'],
            ];
        }

        foreach ($locationBreakdown as $item) {
            $label = ucfirst($item['type']) . ' fee - ' . $item['location'];
            $lines[] = ['label' => $label, 'amount' => $item['amount'], 'type' => 'location'];
        }

        if ($ruleDiscountAmount > 0) {
            $lines[] = ['label' => 'Discount (rule)', 'amount' => -$ruleDiscountAmount, 'type' => 'discount'];
        }

        if ($couponDiscountAmount > 0) {
            $lines[] = ['label' => 'Coupon discount', 'amount' => -$couponDiscountAmount, 'type' => 'discount'];
        }

        if ($manualDiscountAmount > 0) {
            $label = $manualDiscountReason ? "Manual discount - {$manualDiscountReason}" : 'Manual discount';
            $lines[] = ['label' => $label, 'amount' => -$manualDiscountAmount, 'type' => 'discount'];
        }

        if ($taxAmount > 0) {
            $lines[] = ['label' => 'VAT', 'amount' => $taxAmount, 'type' => 'tax'];
        }

        if ($depositAmount > 0) {
            $lines[] = ['label' => 'Security deposit', 'amount' => $depositAmount, 'type' => 'deposit'];
        }

        return $lines;
    }
}
