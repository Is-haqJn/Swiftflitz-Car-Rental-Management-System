<?php

namespace App\Services;

use App\DTOs\RentalData;
use App\Enums\CustomerProfileStatus;
use App\Enums\InspectionType;
use App\Enums\RentalPaymentStatus;
use App\Enums\RentalStatus;
use App\Enums\TransactionType;
use App\Enums\VehicleStatus;
use App\Events\BookingCreated;
use App\Events\RentalCancelled;
use App\Events\RentalCompleted;
use App\Events\RentalCreated;
use App\Events\RentalPickedUp;
use App\Events\RentalReturned;
use App\Events\RentalStatusChanged;
use App\Jobs\ProcessRentalVideoJob;
use App\Mail\BookingPaymentLinkMail;
use App\Mail\PaymentLinkMail;
use App\Mail\RentalInvoiceMail;
use App\Models\Branch;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\RentalDiscountUsage;
use App\Models\RentalInspection;
use App\Models\RentalLocation;
use App\Models\Vehicle;
use App\Repositories\Contracts\RentalRepositoryInterface;
use App\Services\Contracts\DiscountCouponServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\PricingServiceInterface;
use App\Services\Contracts\RentalServiceInterface;
use App\Settings\CancellationSettings;
use App\Settings\OverdueSettings;
use App\Settings\PricingSettings;
use App\Settings\RentalSettings;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RentalService implements RentalServiceInterface
{
    public function __construct(
        protected RentalRepositoryInterface $repository,
        protected PricingServiceInterface $pricingService,
        protected DiscountCouponServiceInterface $couponService,
        protected PricingSettings $pricingSettings,
        protected RentalSettings $rentalSettings,
        protected CancellationSettings $cancellationSettings,
        protected PaymentServiceInterface $paymentService,
    ) {}

    /* Queries */
    public function getAll(): mixed
    {
        return $this->repository->getAll();
    }

    public function findRental(string $id): Rental
    {
        return $this->repository->findRental($id);
    }

    /* Create */
    public function create(RentalData $data): Rental
    {
        return DB::transaction(function () use ($data) {
            $vehicle = Vehicle::with('category')->findOrFail($data->vehicleId);
            $customer = Customer::findOrFail($data->customerId);
            $bookingBranch = $data->branchId ? Branch::find($data->branchId) : null;

            // Compute pricing via PricingService
            $pricing = $this->pricingService->calculate(
                vehicle: $vehicle,
                pickupDate: $data->pickupDate,
                returnDate: $data->returnDate,
                customer: $customer,
                addons: $data->addons,
                pickupLocationId: $data->pickupLocationId,
                dropoffLocationId: $data->dropoffLocationId,
                couponCode: $data->couponCode,
                manualDiscount: $data->manualDiscountAmount,
                manualDiscountReason: $data->manualDiscountReason,
                skipDeposit: $data->skipSecurityDeposit,
                overrideBaseCost: $data->overrideBaseCost,
                bookingBranch: $bookingBranch,
                youngDriverOverride: $data->youngDriverOverride,
            );

            // Snapshot coupon if applied
            $couponApplied = null;
            if ($data->couponCode && $pricing->couponDiscountAmount > 0) {
                $coupon = $this->couponService->validateCode($data->couponCode, $customer->id);
                $couponApplied = [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'name' => $coupon->name,
                    'type' => $coupon->type?->value,
                    'value' => (float) $coupon->value,
                    'discount_amount' => $pricing->couponDiscountAmount,
                ];
            }

            // Resolve initial payment and payment status
            $initialPayment = round($data->initialPayment, 2);
            $paymentStatus = match (true) {
                $pricing->totalAmount <= 0 => RentalPaymentStatus::Paid,
                $initialPayment <= 0 => RentalPaymentStatus::Pending,
                $initialPayment < $pricing->totalAmount => RentalPaymentStatus::PartiallyPaid,
                default => RentalPaymentStatus::Paid,
            };

            // Enforce allow_online_booking for website-sourced bookings
            $bookingSource = $data->source ?? 'website';
            if ($bookingSource === 'website' && ! $this->rentalSettings->allow_online_booking) {
                throw ValidationException::withMessages([
                    'source' => ['Online booking is currently disabled. Please contact us to make a reservation.'],
                ]);
            }

            // Build pickup/dropoff location names
            $pickupLocationName = null;
            $dropoffLocationName = null;
            if ($data->pickupLocationId) {
                $loc = RentalLocation::find($data->pickupLocationId);
                $pickupLocationName = $loc?->name;
            }
            if ($data->dropoffLocationId) {
                $loc = RentalLocation::find($data->dropoffLocationId);
                $dropoffLocationName = $loc?->name;
            }

            /*
             * Determine initial rental status.
             * Admin-created rentals always start as Pending and require explicit confirmation.
             * Website bookings auto-confirm when auto_confirm_bookings is on and
             * booking_requires_confirmation is off.
             */
            $initialStatus = RentalStatus::Pending->value;
            if (($data->paymentMethod ?? null) === 'in_store') {
                $initialStatus = RentalStatus::Confirmed->value;
            } elseif (
                $bookingSource === 'website'
                && $this->rentalSettings->auto_confirm_bookings
                && ! $this->rentalSettings->booking_requires_confirmation
                && $customer->profile_status === CustomerProfileStatus::Verified
            ) {
                $initialStatus = RentalStatus::Confirmed->value;
            }

            $rental = $this->repository->createRental([
                'reference' => $this->repository->generateReference(),
                'branch_id' => $data->branchId,
                'vehicle_id' => $data->vehicleId,
                'customer_id' => $data->customerId,
                'manager_id' => auth()->id(),
                'source' => $bookingSource,
                'status' => $initialStatus,
                'payment_status' => $paymentStatus->value,
                'pickup_date' => $data->pickupDate,
                'pickup_time' => $data->pickupTime ?? '09:00',
                'return_date' => $data->returnDate,
                'return_time' => $data->returnTime ?? '17:00',
                'pickup_location' => $pickupLocationName,
                'dropoff_location' => $dropoffLocationName,
                'pickup_location_id' => $data->pickupLocationId,
                'dropoff_location_id' => $data->dropoffLocationId,
                // Pricing snapshot
                'rental_days' => $pricing->rentalDays,
                'daily_rate' => $pricing->dailyRate,
                'base_cost' => $pricing->base,
                'extras_cost' => $pricing->addonTotal,
                'additional_charges' => $pricing->addonTotal, // alias
                'location_charge' => $pricing->locationTotal,
                'subtotal' => $pricing->subtotal,
                'vat_amount' => $pricing->taxAmount > 0 ? $pricing->taxAmount : null,
                'total_cost' => $pricing->totalAmount,
                'currency' => $pricing->currency ?: null,
                'currency_symbol' => $pricing->currencySymbol ?: null,
                'exchange_rate' => $pricing->exchangeRate,
                'total_cost_global' => $pricing->totalAmountGlobal,
                // Discounts
                'rule_discount_amount' => $pricing->ruleDiscountAmount,
                'coupon_discount_amount' => $pricing->couponDiscountAmount,
                'manual_discount_amount' => $pricing->manualDiscountAmount,
                'manual_discount_reason' => $data->manualDiscountReason,
                'manual_discount_by' => $pricing->manualDiscountAmount > 0 ? auth()->id() : null,
                'total_discount_amount' => $pricing->totalDiscountAmount,
                // Snapshots
                'applied_charges_breakdown' => $pricing->breakdown,
                'coupon_applied' => $couponApplied,
                // Payment
                'amount_paid' => $initialPayment,
                // Security deposit
                'security_deposit_amount' => $pricing->depositAmount > 0 ? $pricing->depositAmount : null,
                'security_deposit_status' => $this->depositStatusForCreate($data, $pricing->depositAmount),
                'deposit_paid' => $data->collectDepositNow && ! $data->skipSecurityDeposit && $pricing->depositAmount > 0 ? $pricing->depositAmount : 0,
                'deposit_collected_at' => $data->collectDepositNow && ! $data->skipSecurityDeposit && $pricing->depositAmount > 0 ? now() : null,
                'deposit_collected_by' => $data->collectDepositNow && ! $data->skipSecurityDeposit && $pricing->depositAmount > 0 ? auth()->id() : null,
                'skip_security_deposit' => $data->skipSecurityDeposit,
                'young_driver_override' => $data->youngDriverOverride,
                // Notes
                'customer_notes' => $data->customerNotes,
                'admin_notes' => $data->adminNotes,
            ]);

            // Record coupon usage
            if ($couponApplied) {
                CouponUsage::create([
                    'coupon_id' => $couponApplied['id'],
                    'customer_id' => $data->customerId,
                    'rental_id' => $rental->id,
                    'used_at' => now(),
                ]);
                $this->couponService->incrementUsage($couponApplied['id']);
            }

            // Record discount rule usages (if rule discount applied)
            if ($pricing->ruleDiscountAmount > 0) {
                RentalDiscountUsage::create([
                    'rental_id' => $rental->id,
                    'discount_rule_id' => null,
                    'applied_by' => auth()->id(),
                    'discount_type' => 'rule',
                    'amount' => $pricing->ruleDiscountAmount,
                    'note' => 'Auto rule discount at booking',
                ]);
            }

            if ($pricing->manualDiscountAmount > 0) {
                RentalDiscountUsage::create([
                    'rental_id' => $rental->id,
                    'discount_rule_id' => null,
                    'applied_by' => auth()->id(),
                    'discount_type' => 'manual',
                    'amount' => $pricing->manualDiscountAmount,
                    'note' => $data->manualDiscountReason,
                ]);
            }

            $created = $this->repository->findRental($rental->id);

            if ($initialPayment > 0) {
                $this->recordManualTransaction($created, $initialPayment, [], TransactionType::InitialPayment);
            }

            $depositCollectedNow = $data->collectDepositNow && ! $data->skipSecurityDeposit && $pricing->depositAmount > 0;
            if ($depositCollectedNow) {
                $this->recordRefundTransaction(
                    $created,
                    round($pricing->depositAmount, 2),
                    TransactionType::SecurityDeposit,
                    'DEP-'
                );
            }

            RentalCreated::dispatch($created);
            BookingCreated::dispatch($created);

            /* Fire status-changed event for auto-confirmed website bookings */
            if ($initialStatus === RentalStatus::Confirmed->value) {
                RentalStatusChanged::dispatch($created, RentalStatus::Pending->value, RentalStatus::Confirmed->value);
            }

            return $created;
        });
    }

    /* Update / Delete */
    public function update(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $pricingFields = ['pickup_date', 'return_date', 'pickup_location_id', 'dropoff_location_id'];
            $hasPricingChange = collect($pricingFields)->some(fn ($f) => array_key_exists($f, $data));

            if ($hasPricingChange) {
                $rental = $this->repository->findRental($id);
                $rental->loadMissing(['vehicle.category', 'vehicle.branch', 'customer']);

                $pickupDate = $data['pickup_date'] ?? $rental->pickup_date->format('Y-m-d');
                $returnDate = $data['return_date'] ?? $rental->return_date->format('Y-m-d');
                $pickupLocationId = array_key_exists('pickup_location_id', $data)
                    ? $data['pickup_location_id']
                    : $rental->pickup_location_id;
                $dropoffLocationId = array_key_exists('dropoff_location_id', $data)
                    ? $data['dropoff_location_id']
                    : $rental->dropoff_location_id;

                $existingAddons = collect($rental->applied_charges_breakdown ?? [])
                    ->filter(fn ($item) => ($item['type'] ?? '') === 'addon' && isset($item['id']))
                    ->map(fn ($item) => ['id' => $item['id'], 'quantity' => (int) ($item['quantity'] ?? 1)])
                    ->values()
                    ->all();

                $couponCode = null;
                if ($rental->coupon_applied && is_array($rental->coupon_applied)) {
                    $couponCode = $rental->coupon_applied['code'] ?? null;
                }

                $pricing = $this->pricingService->calculate(
                    vehicle: $rental->vehicle,
                    pickupDate: $pickupDate,
                    returnDate: $returnDate,
                    customer: $rental->customer,
                    addons: $existingAddons,
                    pickupLocationId: $pickupLocationId,
                    dropoffLocationId: $dropoffLocationId,
                    couponCode: $couponCode,
                    manualDiscount: (float) $rental->manual_discount_amount,
                    manualDiscountReason: $rental->manual_discount_reason,
                    skipDeposit: (bool) $rental->skip_security_deposit,
                );

                /* Update location name snapshots when IDs change */
                if (array_key_exists('pickup_location_id', $data)) {
                    $pickupLoc = $pickupLocationId ? RentalLocation::find($pickupLocationId) : null;
                    $data['pickup_location'] = $pickupLoc?->name;
                }
                if (array_key_exists('dropoff_location_id', $data)) {
                    $dropoffLoc = $dropoffLocationId ? RentalLocation::find($dropoffLocationId) : null;
                    $data['dropoff_location'] = $dropoffLoc?->name;
                }

                $data = array_merge($data, [
                    'rental_days' => $pricing->rentalDays,
                    'daily_rate' => $pricing->dailyRate,
                    'base_cost' => $pricing->base,
                    'extras_cost' => $pricing->addonTotal,
                    'additional_charges' => $pricing->addonTotal,
                    'location_charge' => $pricing->locationTotal,
                    'subtotal' => $pricing->subtotal,
                    'vat_amount' => $pricing->taxAmount > 0 ? $pricing->taxAmount : null,
                    'total_cost' => $pricing->totalAmount,
                    'rule_discount_amount' => $pricing->ruleDiscountAmount,
                    'coupon_discount_amount' => $pricing->couponDiscountAmount,
                    'total_discount_amount' => $pricing->totalDiscountAmount,
                    'applied_charges_breakdown' => $pricing->breakdown,
                ]);
            }

            return $this->repository->updateRental($id, $data);
        });
    }

    public function delete(string $id): void
    {
        $rental = $this->repository->findRental($id);

        if (in_array($rental->status, [RentalStatus::Active, RentalStatus::Overdue])) {
            throw ValidationException::withMessages([
                'rental' => ['Cannot delete an active or overdue rental.'],
            ]);
        }

        $this->repository->deleteRental($id);
    }

    /* Lifecycle */
    public function confirm(string $id): Rental
    {
        return DB::transaction(function () use ($id) {
            $rental = $this->repository->findRental($id);

            if ($rental->status !== RentalStatus::Pending) {
                throw ValidationException::withMessages([
                    'status' => ['Only pending rentals can be confirmed.'],
                ]);
            }

            $oldStatus = $rental->status->value;
            $confirmed = $this->repository->updateRental($id, [
                'status' => RentalStatus::Confirmed->value,
                'confirmed_by' => auth()->id(),
            ]);

            RentalStatusChanged::dispatch($confirmed, $oldStatus, RentalStatus::Confirmed->value);

            return $confirmed;
        });
    }

    public function processPickup(string $id, array $data, array $photoFiles = []): Rental
    {
        return DB::transaction(function () use ($id, $data, $photoFiles) {
            $rental = $this->repository->findRental($id);

            if (! in_array($rental->status, [RentalStatus::Confirmed, RentalStatus::Pending])) {
                throw ValidationException::withMessages([
                    'status' => ['Rental must be confirmed or pending to process pickup.'],
                ]);
            }

            $vehicleInUse = Rental::where('vehicle_id', $rental->vehicle_id)
                ->where('id', '!=', $rental->id)
                ->whereIn('status', [RentalStatus::Active->value, RentalStatus::Overdue->value])
                ->exists();

            if ($vehicleInUse) {
                throw ValidationException::withMessages([
                    'vehicle' => ['Vehicle is currently in use under another rental - cannot process pickup until it is returned and processed.'],
                ]);
            }

            if ($rental->customer && $rental->customer->profile_status === CustomerProfileStatus::Incomplete) {
                throw ValidationException::withMessages([
                    'profile' => ['Cannot process pickup: the customer has not completed their profile yet.'],
                ]);
            }

            // Strict deposit enforcement: deposit must be held before pickup is allowed
            if ($this->pricingSettings->charge_deposit
                && ! $rental->skip_security_deposit
                && $this->pricingSettings->deposit_enforcement_mode === 'strict'
                && $rental->security_deposit_status !== 'held') {
                throw ValidationException::withMessages([
                    'security_deposit' => ['Security deposit must be collected before pickup (strict mode is enabled).'],
                ]);
            }

            // Late pickup fee is passed explicitly from the controller (computed by frontend preview)
            $latePickupFee = isset($data['late_pickup_fee']) ? round((float) $data['late_pickup_fee'], 2) : null;

            // Create pickup inspection
            $damageNoted = (bool) ($data['damage_noted'] ?? false);
            $inspection = RentalInspection::create([
                'rental_id' => $id,
                'type' => InspectionType::Pickup->value,
                'inspector_id' => auth()->id(),
                'fuel_level' => $data['fuel_level'] ?? null,
                'mileage' => $data['mileage'] ?? null,
                'condition_notes' => $data['condition_notes'] ?? null,
                'damage_noted' => $damageNoted,
                'damage_types' => $damageNoted ? ($data['damage_types'] ?? null) : null,
                'damage_severity' => $damageNoted ? ($data['damage_severity'] ?? null) : null,
                'damage_description' => $damageNoted ? ($data['damage_description'] ?? null) : null,
            ]);

            // Store photos if provided
            if (! empty($photoFiles)) {
                $paths = [];
                foreach ($photoFiles as $file) {
                    $paths[] = Storage::disk('public')->putFile('inspection-photos', $file);
                }
                $inspection->update(['photos' => $paths]);
            }

            // Mark vehicle as rented
            $rental->vehicle->update(['status' => VehicleStatus::Rented->value]);

            $now = now();
            $scheduledPickup = $rental->scheduledPickupDate->startOfDay();
            $earlyDays = (int) $scheduledPickup->diffInDays($now->copy()->startOfDay(), false);
            // diffInDays returns negative when $now is before $scheduledPickup
            $isEarlyPickup = $earlyDays < 0;
            $earlyDays = $isEarlyPickup ? abs($earlyDays) : 0;

            // Track effective total cost - may increase for Scenario A
            $effectiveTotalCost = (float) $rental->total_cost;

            $updateFields = [
                'status' => RentalStatus::Active->value,
                'actual_pickup_date' => $now,
                'late_pickup_fee' => $latePickupFee,
            ];

            if ($isEarlyPickup && $earlyDays > 0) {
                $conflictingBooking = Rental::where('vehicle_id', $rental->vehicle_id)
                    ->where('id', '!=', $rental->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->whereBetween('pickup_date', [
                        $now->copy()->startOfDay(),
                        $scheduledPickup->copy()->subDay()->endOfDay(),
                    ])
                    ->orderBy('pickup_date')
                    ->first(['id', 'pickup_date']);

                if ($conflictingBooking) {
                    throw ValidationException::withMessages([
                        'early_pickup' => [
                            'Vehicle already has a booking on '
                            . Carbon::parse($conflictingBooking->pickup_date)->format('M j, Y')
                            . ' - cannot pick up early until that rental is returned and processed.',
                        ],
                    ]);
                }

                $earlyOption = $data['early_pickup_option'] ?? 'shift_return_date';
                $updateFields['early_pickup_days'] = $earlyDays;

                if ($earlyOption === 'shift_return_date') {
                    // Scenario B: shift return date earlier by earlyDays - no repricing
                    $newReturnDate = $rental->return_date->copy()->subDays($earlyDays);
                    $updateFields['return_date'] = $newReturnDate->format('Y-m-d');
                    if (! $rental->original_return_date) {
                        $updateFields['original_return_date'] = $rental->return_date->format('Y-m-d');
                    }
                } else {
                    // Scenario A: keep original return date - charge for extra days
                    $breakdown = $rental->applied_charges_breakdown ?? [];
                    $baseLine = collect($breakdown)->firstWhere('type', 'base');
                    $originalDays = (int) $rental->rental_days - (int) ($rental->extension_days ?? 0);
                    $dailyRate = ($baseLine && $originalDays > 0)
                        ? round((float) $baseLine['amount'] / $originalDays, 2)
                        : round((float) $rental->daily_rate, 2);

                    $earlyBase = round($dailyRate * $earlyDays, 2);
                    $earlyExtras = 0.0;
                    $earlyAddonLines = [];

                    foreach ($breakdown as $item) {
                        if (($item['type'] ?? '') === 'addon' && ($item['is_per_day'] ?? false) && isset($item['unit_rate'])) {
                            $addonEarly = round((float) $item['unit_rate'] * $earlyDays, 2);
                            $earlyExtras += $addonEarly;
                            $earlyAddonLines[] = [
                                'label' => 'Early Pickup – ' . ($item['label'] ?? 'Add-on') . ' (' . $earlyDays . 'd × ' . number_format((float) $item['unit_rate'], 2) . '/day)',
                                'amount' => $addonEarly,
                                'type' => 'early_pickup_addon',
                            ];
                        }
                    }
                    $earlyExtras = round($earlyExtras, 2);
                    $earlySubtotal = round($earlyBase + $earlyExtras, 2);

                    $earlyVat = 0.0;
                    if ($this->rentalSettings->vat_enabled && $this->rentalSettings->vat_rate > 0) {
                        $earlyVat = round($earlySubtotal * ($this->rentalSettings->vat_rate / 100), 2);
                    }
                    $earlyTotal = round($earlySubtotal + $earlyVat, 2);

                    // Insert early pickup lines before tax/deposit in breakdown
                    $earlyLines = array_merge(
                        [[
                            'label' => 'Early Pickup (' . $earlyDays . 'd × ' . number_format($dailyRate, 2) . '/day)',
                            'amount' => $earlyBase,
                            'type' => 'early_pickup',
                            'early_pickup_days' => $earlyDays,
                        ]],
                        $earlyAddonLines
                    );

                    $insertAt = count($breakdown);
                    foreach ($breakdown as $i => $line) {
                        if (in_array($line['type'] ?? '', ['tax', 'deposit'])) {
                            $insertAt = $i;
                            break;
                        }
                    }
                    array_splice($breakdown, $insertAt, 0, $earlyLines);

                    if ($earlyVat > 0) {
                        foreach ($breakdown as &$line) {
                            if (($line['type'] ?? '') === 'tax') {
                                $line['amount'] = round((float) $line['amount'] + $earlyVat, 2);
                                break;
                            }
                        }
                        unset($line);
                    }

                    $newTotal = round($effectiveTotalCost + $earlyTotal, 2);
                    $effectiveTotalCost = $newTotal;

                    $updateFields['rental_days'] = (int) $rental->rental_days + $earlyDays;
                    $updateFields['base_cost'] = round((float) $rental->base_cost + $earlyBase, 2);
                    $updateFields['extras_cost'] = round((float) $rental->extras_cost + $earlyExtras, 2);
                    $updateFields['additional_charges'] = round((float) $rental->additional_charges + $earlyExtras, 2);
                    $updateFields['subtotal'] = round((float) $rental->subtotal + $earlySubtotal, 2);
                    if ($earlyVat > 0) {
                        $updateFields['vat_amount'] = round((float) ($rental->vat_amount ?? 0) + $earlyVat, 2);
                    }
                    $updateFields['total_cost'] = $newTotal;
                    $updateFields['applied_charges_breakdown'] = $breakdown;

                    if ($rental->payment_status === RentalPaymentStatus::Paid && $earlyTotal > 0) {
                        $updateFields['payment_status'] = RentalPaymentStatus::PartiallyPaid->value;
                    }
                }
            }

            // Optionally record amount paid at pickup
            $pickupPayment = isset($data['amount_paid']) ? round((float) $data['amount_paid'], 2) : 0;
            if ($pickupPayment > 0) {
                $newAmountPaid = round((float) $rental->amount_paid + $pickupPayment, 2);
                $amountDue = round(max(0.0, $effectiveTotalCost - $newAmountPaid), 2);
                $updateFields['amount_paid'] = $newAmountPaid;
                $updateFields['settlement_status'] = $amountDue <= 0 ? 'settled' : null;
                $updateFields['payment_status'] = $amountDue <= 0
                    ? RentalPaymentStatus::Paid->value
                    : RentalPaymentStatus::PartiallyPaid->value;
            }

            // Optionally mark security deposit as collected
            if (! empty($data['collect_deposit'])
                && $rental->security_deposit_status === 'pending'
                && (float) $rental->security_deposit_amount > 0) {
                $updateFields['deposit_paid'] = $rental->security_deposit_amount;
                $updateFields['security_deposit_status'] = 'held';
                $updateFields['deposit_collected_at'] = now();
                $updateFields['deposit_collected_by'] = auth()->id();
            }

            $pickedUp = $this->repository->updateRental($id, $updateFields);

            if (! empty($data['collect_deposit'])
                && $rental->security_deposit_status === 'pending'
                && (float) $rental->security_deposit_amount > 0) {
                $pickedUp->load('customer');
                $this->recordRefundTransaction(
                    $pickedUp,
                    round((float) $rental->security_deposit_amount, 2),
                    TransactionType::SecurityDeposit,
                    'DEP-'
                );
            }

            if ($pickupPayment > 0) {
                $amountDueAfterPickup = round(max(0.0, $effectiveTotalCost - round((float) $rental->amount_paid + $pickupPayment, 2)), 2);
                $isFirstPayment = (float) $rental->amount_paid === 0.0;
                $pickupTxType = $isFirstPayment
                    ? TransactionType::InitialPayment
                    : ($amountDueAfterPickup <= 0 ? TransactionType::FullPayment : TransactionType::PartPayment);
                $this->recordManualTransaction($pickedUp, $pickupPayment, $data, $pickupTxType);
            }

            RentalPickedUp::dispatch($pickedUp);
            RentalStatusChanged::dispatch($pickedUp, $rental->status->value, RentalStatus::Active->value);

            return $pickedUp;
        });
    }

    public function processReturn(string $id, array $data, array $photoFiles = []): Rental
    {
        return DB::transaction(function () use ($id, $data, $photoFiles) {
            $rental = $this->repository->findRental($id);

            if (! in_array($rental->status, [RentalStatus::Active, RentalStatus::Overdue])) {
                throw ValidationException::withMessages([
                    'status' => ['Rental must be active or overdue to process return.'],
                ]);
            }

            $actualReturn = now();

            // Overdue calculation
            $overdueData = $this->pricingService->calculateOverdue($rental, $actualReturn);
            $overdueFee = null;
            $overdueMinutes = null;
            $isOverdue = false;
            if ($overdueData) {
                $overdueFee = $overdueData['charge'];
                $overdueMinutes = $overdueData['overdue_minutes'];
                $isOverdue = true;
            }

            // Early return calculation
            $earlyReturnData = $this->pricingService->calculateEarlyReturn($rental, $actualReturn);
            $isEarlyReturn = $earlyReturnData['is_early_return'];
            $savedDays = $earlyReturnData['saved_days'];
            $actualRentalDays = $rental->rental_days - $savedDays;

            // Resolve early return charge (manager can waive at return time)
            $earlyReturnCharge = null;
            $earlyReturnChargeWaived = false;
            $earlyReturnChargeWaivedBy = null;
            $earlyReturnChargeWaiverReason = null;

            if ($isEarlyReturn && ! $earlyReturnData['below_threshold'] && $earlyReturnData['charge_applies']) {
                $waivedByManager = (bool) ($data['waive_early_return_charge'] ?? false);

                if ($waivedByManager) {
                    $earlyReturnChargeWaived = true;
                    $earlyReturnChargeWaivedBy = auth()->id();
                    $earlyReturnChargeWaiverReason = $data['early_return_charge_waiver_reason'] ?? null;
                } else {
                    $earlyReturnCharge = $earlyReturnData['charge_amount'];
                }
            }

            // Refund for unused days (only when refund is enabled and not below threshold)
            $earlyReturnRefund = 0.0;
            if ($isEarlyReturn && ! $earlyReturnData['below_threshold'] && $earlyReturnData['refund_enabled']) {
                // Recalculate refund considering whether charge was waived
                $appliedCharge = $earlyReturnCharge ?? 0.0;
                $daysUsedCost = $earlyReturnData['days_used_cost'];
                $effectiveOwed = round($daysUsedCost + $appliedCharge, 2);
                $earlyReturnRefund = round(max(0.0, (float) $rental->total_cost - $effectiveOwed), 2);
            }

            // Optional payment at return
            $additionalPayment = isset($data['amount_paid']) ? round((float) $data['amount_paid'], 2) : 0;
            $totalAmountPaid = round((float) $rental->amount_paid + $additionalPayment, 2);

            // Damage
            $hasDamage = (bool) ($data['damage_noted'] ?? false);
            $estimatedRepairCost = $hasDamage ? (float) ($data['estimated_repair_cost'] ?? 0) : null;

            // Create return inspection
            $inspection = RentalInspection::create([
                'rental_id' => $id,
                'type' => InspectionType::Return->value,
                'inspector_id' => auth()->id(),
                'fuel_level' => $data['fuel_level'] ?? null,
                'mileage' => $data['mileage'] ?? null,
                'condition_notes' => $data['condition_notes'] ?? null,
                'damage_noted' => $hasDamage,
                'damage_types' => $hasDamage ? ($data['damage_types'] ?? null) : null,
                'damage_severity' => $hasDamage ? ($data['damage_severity'] ?? null) : null,
                'damage_description' => $hasDamage ? ($data['damage_description'] ?? null) : null,
            ]);

            // Store photos if provided
            if (! empty($photoFiles)) {
                $paths = [];
                foreach ($photoFiles as $file) {
                    $paths[] = Storage::disk('public')->putFile('inspection-photos', $file);
                }
                $inspection->update(['photos' => $paths]);
            }

            // Mark vehicle as available
            $rental->vehicle->update(['status' => VehicleStatus::Available->value]);

            // Determine settlement status and customer refund
            $effectiveCost = round(
                max(0.0, (float) $rental->total_cost + ($overdueFee ?? 0) + (float) ($rental->late_pickup_fee ?? 0) + ($earlyReturnCharge ?? 0) - $earlyReturnRefund),
                2
            );
            $amountDue = round(max(0.0, $effectiveCost - $totalAmountPaid), 2);

            // Customer is owed a cash refund when they overpaid relative to effective cost
            $customerRefundDue = round(max(0.0, $totalAmountPaid - $effectiveCost), 2);

            // Settlement only pending when customer still owes money; overpayment is tracked via refund_status
            $settlementStatus = $amountDue > 0 ? 'pending' : null;

            $damageSettlementStatus = $hasDamage ? 'pending' : null;

            $updateFields = [
                'status' => RentalStatus::Returned->value,
                'actual_return_date' => $actualReturn,
                'overdue_fee' => $overdueFee,
                'overdue_minutes' => $overdueMinutes,
                'is_overdue' => $isOverdue,
                'is_early_return' => $isEarlyReturn,
                'actual_rental_days' => $actualRentalDays,
                'days_used_cost' => $isEarlyReturn && $earlyReturnData['days_used_cost'] > 0 ? $earlyReturnData['days_used_cost'] : null,
                'early_return_refund' => $earlyReturnRefund > 0 ? $earlyReturnRefund : 0.0,
                'early_return_charge' => $earlyReturnCharge,
                'early_return_charge_waived' => $earlyReturnChargeWaived,
                'early_return_charge_waived_by' => $earlyReturnChargeWaivedBy,
                'early_return_charge_waiver_reason' => $earlyReturnChargeWaiverReason,
                'early_return_reason' => $data['early_return_reason'] ?? null,
                'has_damage' => $hasDamage,
                'estimated_repair_cost' => $estimatedRepairCost,
                'settlement_status' => $settlementStatus,
                'damage_settlement_status' => $damageSettlementStatus,
            ];

            if ($customerRefundDue > 0) {
                $updateFields['refund_amount'] = $customerRefundDue;
                $updateFields['refund_status'] = 'pending';
            }

            if ($additionalPayment > 0) {
                $updateFields['amount_paid'] = $totalAmountPaid;
                $updateFields['payment_status'] = $amountDue <= 0
                    ? RentalPaymentStatus::Paid->value
                    : RentalPaymentStatus::PartiallyPaid->value;
            }

            $returned = $this->repository->updateRental($id, $updateFields);

            if ($additionalPayment > 0) {
                $txType = $amountDue <= 0 ? TransactionType::FullPayment : TransactionType::PartPayment;
                $this->recordManualTransaction($returned, $additionalPayment, $data, $txType);
            }

            /* Record estimated repair cost as a pending transaction when damage is noted at return */
            if ($hasDamage && $estimatedRepairCost > 0) {
                $existingEstimate = PaymentTransaction::query()
                    ->where('transactable_type', 'rental')
                    ->where('transactable_id', $id)
                    ->where('type', TransactionType::RepairCost->value)
                    ->where('status', 'pending')
                    ->latest()
                    ->first();

                if (! $existingEstimate) {
                    $this->recordDamageTransaction($returned, $estimatedRepairCost, TransactionType::RepairCost, pending: true);
                }
            }

            RentalReturned::dispatch($returned);
            RentalStatusChanged::dispatch($returned, $rental->status->value, RentalStatus::Returned->value);

            return $returned;
        });
    }

    public function approveReturn(string $id, array $data = []): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            if ($rental->status !== RentalStatus::Returned) {
                throw ValidationException::withMessages([
                    'status' => ['Rental must be in returned state to approve.'],
                ]);
            }

            $forceSettle = (bool) ($data['force_settle'] ?? false);
            $updateFields = ['status' => RentalStatus::Completed->value];

            if ($forceSettle) {
                $updateFields['settlement_status'] = 'settled';
                $updateFields['payment_status'] = RentalPaymentStatus::Paid->value;
                if ($rental->has_damage && $rental->damage_settlement_status === 'pending') {
                    $updateFields['damage_settlement_status'] = 'settled';
                }
                // Force-settle waives any pending customer refund
                if ($rental->refund_status === 'pending') {
                    $updateFields['refund_status'] = 'waived';
                    $updateFields['refund_amount'] = 0.0;
                }
            } else {
                // Block if either settlement track is still pending
                if ($rental->settlement_status === 'pending') {
                    throw ValidationException::withMessages([
                        'settlement_status' => ['Rental balance settlement is still pending.'],
                    ]);
                }

                if ($rental->damage_settlement_status === 'pending') {
                    throw ValidationException::withMessages([
                        'damage_settlement_status' => ['Damage settlement is still pending.'],
                    ]);
                }
            }

            // Auto-refund deposit if it's still held and not forfeited
            if ($rental->security_deposit_status === 'held') {
                $availableDeposit = max(
                    0,
                    (float) $rental->deposit_paid
                        - (float) ($rental->deposit_applied_to_balance ?? 0)
                        - (float) ($rental->cancellation_deposit_deduction ?? 0)
                        - ($rental->damage_settlement_status === 'forfeited' ? (float) ($rental->actual_repair_cost ?? 0) : 0)
                        - (float) $rental->deposit_refunded
                );
                if ($availableDeposit > 0) {
                    $updateFields['security_deposit_status'] = 'refunded';
                    $updateFields['deposit_refunded'] = round($availableDeposit, 2);
                }
            }

            $completed = $this->repository->updateRental($id, $updateFields);

            if (isset($updateFields['deposit_refunded']) && $updateFields['deposit_refunded'] > 0) {
                $completed->load('customer');
                $this->recordRefundTransaction(
                    $completed,
                    $updateFields['deposit_refunded'],
                    TransactionType::DepositRefund,
                    'DEP-'
                );
            }

            RentalCompleted::dispatch($completed);
            RentalStatusChanged::dispatch($completed, $rental->status->value, RentalStatus::Completed->value);

            return $completed;
        });
    }

    public function cancel(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            if (in_array($rental->status, [
                RentalStatus::Completed,
                RentalStatus::Cancelled,
            ])) {
                throw ValidationException::withMessages([
                    'status' => ['Cannot cancel a completed or already cancelled rental.'],
                ]);
            }

            if (
                in_array($rental->status, [RentalStatus::Active, RentalStatus::Overdue]) &&
                $this->cancellationSettings->cancellation_cutoff_days > 0
            ) {
                $cutoff = Carbon::parse($rental->return_date)
                    ->subDays($this->cancellationSettings->cancellation_cutoff_days)
                    ->startOfDay();

                if (now()->gte($cutoff)) {
                    throw ValidationException::withMessages([
                        'status' => ['Cancellation is no longer available - within ' . $this->cancellationSettings->cancellation_cutoff_days . ' day(s) of the return date.'],
                    ]);
                }
            }

            $cancellationData = $this->pricingService->calculateCancellation($rental);
            $cancellationFee = round((float) $cancellationData['fee'], 2);
            $daysUsedCost = round((float) ($cancellationData['days_used_cost'] ?? 0.0), 2);
            $totalDeduction = round($daysUsedCost + $cancellationFee, 2);
            $amountPaid = (float) $rental->amount_paid;
            $refundAmount = round(max(0.0, $amountPaid - $totalDeduction), 2);
            $amountOwed = round(max(0.0, $totalDeduction - $amountPaid), 2);

            // Release vehicle if it was active/confirmed
            if (in_array($rental->status, [RentalStatus::Active, RentalStatus::Overdue])) {
                $rental->vehicle->update(['status' => VehicleStatus::Available->value]);
            }

            $cancelled = $this->repository->updateRental($id, [
                'status' => RentalStatus::Cancelled->value,
                'cancellation_reason' => $data['reason'] ?? null,
                'cancelled_by_type' => $data['cancelled_by_type'] ?? 'business',
                'cancelled_by' => auth()->id(),
                'cancelled_at' => now(),
                'cancellation_fee' => $cancellationFee,
                'days_used_cost' => $daysUsedCost > 0 ? $daysUsedCost : null,
                'refund_amount' => $refundAmount > 0 ? $refundAmount : null,
                'refund_status' => $refundAmount > 0 ? 'pending' : null,
                'cancellation_amount_owed' => $amountOwed > 0 ? $amountOwed : null,
            ]);

            RentalCancelled::dispatch($cancelled);

            return $cancelled;
        });
    }

    public function settleRefund(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            $hasRefundPending = $rental->refund_status === 'pending';
            $hasDebtPending = (float) ($rental->cancellation_amount_owed ?? 0) > 0;

            if (! $hasRefundPending && ! $hasDebtPending) {
                throw ValidationException::withMessages([
                    'status' => ['No pending refund or debt to settle.'],
                ]);
            }

            $action = $data['action'];

            if ($action === 'approved' && $hasRefundPending) {
                $refundAmount = round((float) ($data['refund_amount'] ?? $rental->refund_amount), 2);

                $updated = $this->repository->updateRental($id, [
                    'refund_status' => 'approved',
                    'refund_amount' => $refundAmount,
                    'payment_status' => RentalPaymentStatus::Refunded->value,
                ]);
                if ($refundAmount > 0) {
                    $updated->load('customer');
                    $this->recordRefundTransaction($updated, $refundAmount, TransactionType::Refund);
                }

                return $updated;
            }

            if ($action === 'waived' && $hasRefundPending) {
                return $this->repository->updateRental($id, [
                    'refund_status' => 'waived',
                    'refund_amount' => 0.0,
                    'payment_status' => RentalPaymentStatus::Paid->value,
                ]);
            }

            if ($action === 'mark_received' && $hasDebtPending) {
                $debtAmount = round((float) $rental->cancellation_amount_owed, 2);
                $updated = $this->repository->updateRental($id, [
                    'cancellation_debt_paid' => $debtAmount,
                    'cancellation_amount_owed' => 0,
                    'payment_status' => RentalPaymentStatus::Paid->value,
                ]);
                if ($debtAmount > 0) {
                    $updated->load('customer');
                    $this->recordRefundTransaction($updated, $debtAmount, TransactionType::CancellationFee, 'CANC-');
                }

                return $updated;
            }

            if ($action === 'deduct_deposit' && $hasDebtPending) {
                $depositPaid = (float) $rental->deposit_paid;
                $alreadyDeducted = (float) ($rental->cancellation_deposit_deduction ?? 0);
                $availableDeposit = round(max(0.0, $depositPaid - $alreadyDeducted), 2);

                if ($availableDeposit <= 0) {
                    throw ValidationException::withMessages([
                        'deposit' => ['No deposit available to deduct from.'],
                    ]);
                }

                $owed = (float) $rental->cancellation_amount_owed;
                $deduction = round(min($owed, $availableDeposit), 2);
                $totalDeducted = round($alreadyDeducted + $deduction, 2);
                $remainingOwed = round(max(0.0, $owed - $deduction), 2);
                $depositFullyConsumed = $totalDeducted >= $depositPaid;

                $updated = $this->repository->updateRental($id, [
                    'cancellation_deposit_deduction' => $totalDeducted,
                    'cancellation_amount_owed' => $remainingOwed,
                    'security_deposit_status' => $depositFullyConsumed ? 'forfeited' : $rental->security_deposit_status,
                    'payment_status' => $remainingOwed > 0
                        ? RentalPaymentStatus::Pending->value
                        : RentalPaymentStatus::Paid->value,
                ]);
                if ($deduction > 0) {
                    $updated->load('customer');
                    $this->recordRefundTransaction($updated, $deduction, TransactionType::CancellationFee, 'CANC-');
                }

                return $updated;
            }

            if ($action === 'waive_debt' && $hasDebtPending) {
                return $this->repository->updateRental($id, [
                    'cancellation_debt_waived' => true,
                    'payment_status' => RentalPaymentStatus::Paid->value,
                ]);
            }

            throw ValidationException::withMessages([
                'action' => ['Invalid action for the current state.'],
            ]);
        });
    }

    /* Vehicle Switch (pre-pickup) */
    public function switchVehicle(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            if (! in_array($rental->status, [RentalStatus::Pending, RentalStatus::Confirmed])) {
                throw ValidationException::withMessages([
                    'status' => ['Vehicle can only be switched before pickup.'],
                ]);
            }

            $newVehicle = Vehicle::with('category')->findOrFail($data['vehicle_id']);

            // Reprice with new vehicle (preserve same coupon/discounts JSON, recompute amounts)
            $couponCode = null;
            if ($rental->coupon_applied && is_array($rental->coupon_applied)) {
                $couponCode = $rental->coupon_applied['code'] ?? null;
            }

            // Reconstruct existing addons from the stored breakdown (requires 'id' field added by buildBreakdown)
            $existingAddons = collect($rental->applied_charges_breakdown ?? [])
                ->filter(fn ($item) => ($item['type'] ?? '') === 'addon' && isset($item['id']))
                ->map(fn ($item) => ['id' => $item['id'], 'quantity' => (int) ($item['quantity'] ?? 1)])
                ->values()
                ->all();

            $pricing = $this->pricingService->calculate(
                vehicle: $newVehicle,
                pickupDate: $rental->pickup_date->format('Y-m-d'),
                returnDate: $rental->return_date->format('Y-m-d'),
                customer: $rental->customer,
                addons: $existingAddons,
                pickupLocationId: $rental->pickup_location_id,
                dropoffLocationId: $rental->dropoff_location_id,
                couponCode: $couponCode,
                manualDiscount: (float) $rental->manual_discount_amount,
                manualDiscountReason: $rental->manual_discount_reason,
                skipDeposit: $rental->skip_security_deposit,
            );

            /* Switch fee */
            $switchFee = round((float) ($this->pricingSettings->vehicle_switch_fee ?? 0), 2);
            $newTotal = round($pricing->totalAmount + $switchFee, 2);

            // Inject switch fee as a line item in the breakdown (before tax/deposit lines)
            $breakdown = $pricing->breakdown;
            if ($switchFee > 0) {
                $insertAt = count($breakdown);
                foreach ($breakdown as $i => $line) {
                    if (in_array($line['type'] ?? '', ['tax', 'deposit'])) {
                        $insertAt = $i;
                        break;
                    }
                }
                array_splice($breakdown, $insertAt, 0, [[
                    'label' => 'Vehicle switch fee',
                    'amount' => $switchFee,
                    'type' => 'switch_fee',
                ]]);
            }

            /* Refund flag (customer overpaid for the new cheaper vehicle) */
            $amountPaid = round((float) $rental->amount_paid, 2);
            $refundUpdates = [];
            if ($amountPaid > 0 && $newTotal < $amountPaid) {
                $refundUpdates['refund_amount'] = round($amountPaid - $newTotal, 2);
                $refundUpdates['refund_status'] = 'pending';
            }

            /* Admin notes (switch reason + optional deposit shortfall) */
            $adminNotes = trim(($rental->admin_notes ?? '') . "\nVehicle switched to: " . $newVehicle->name . '. ' . ($data['reason'] ?? ''));
            $newDeposit = $pricing->depositAmount;
            $depositPaid = round((float) $rental->deposit_paid, 2);
            if ($newDeposit > 0 && $depositPaid > 0 && $newDeposit > $depositPaid) {
                $shortfall = round($newDeposit - $depositPaid, 2);
                $adminNotes .= "\nDeposit shortfall after switch: " . number_format($shortfall, 2) . ' (partial deposit - collect difference separately).';
            }

            return $this->repository->updateRental($id, array_merge([
                'vehicle_id' => $newVehicle->id,
                'rental_days' => $pricing->rentalDays,
                'daily_rate' => $pricing->dailyRate,
                'base_cost' => $pricing->base,
                'extras_cost' => $pricing->addonTotal,
                'additional_charges' => $pricing->addonTotal,
                'location_charge' => $pricing->locationTotal,
                'subtotal' => $pricing->subtotal,
                'vat_amount' => $pricing->taxAmount > 0 ? $pricing->taxAmount : null,
                'total_cost' => $newTotal,
                'vehicle_switch_fee' => $switchFee > 0 ? $switchFee : null,
                'rule_discount_amount' => $pricing->ruleDiscountAmount,
                'coupon_discount_amount' => $pricing->couponDiscountAmount,
                'total_discount_amount' => $pricing->totalDiscountAmount,
                'applied_charges_breakdown' => $breakdown,
                'security_deposit_amount' => $pricing->depositAmount > 0 ? $pricing->depositAmount : null,
                'admin_notes' => $adminNotes,
            ], $refundUpdates));
        });
    }

    /* Settlement */
    public function settleRental(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            $payment = round((float) ($data['amount'] ?? 0), 2);
            $newAmountPaid = round((float) $rental->amount_paid + $payment, 2);

            $amountDue = round(
                max(0.0,
                    (float) $rental->total_cost
                    + (float) ($rental->overdue_fee ?? 0)
                    + (float) ($rental->late_pickup_fee ?? 0)
                    + (float) ($rental->early_return_charge ?? 0)
                    - (float) ($rental->early_return_refund ?? 0)
                    - $newAmountPaid
                    - (float) ($rental->deposit_applied_to_balance ?? 0)
                ),
                2
            );

            $settlementStatus = $amountDue <= 0 ? 'settled' : 'pending';
            $paymentStatus = $amountDue <= 0 ? RentalPaymentStatus::Paid : RentalPaymentStatus::PartiallyPaid;

            $updatedRental = $this->repository->updateRental($id, [
                'amount_paid' => $newAmountPaid,
                'settlement_status' => $settlementStatus,
                'payment_status' => $paymentStatus,
            ]);

            /* Full payment if this clears the outstanding balance; otherwise part payment */
            $txType = $amountDue <= 0 ? TransactionType::FullPayment : TransactionType::PartPayment;
            $this->recordManualTransaction($updatedRental, $payment, $data, $txType);

            return $updatedRental;
        });
    }

    public function settleWithDeposit(string $id): Rental
    {
        return DB::transaction(function () use ($id) {
            $rental = $this->repository->findRental($id);

            if ($rental->status !== RentalStatus::Returned) {
                throw ValidationException::withMessages([
                    'status' => ['Rental must be in returned status to use security deposit.'],
                ]);
            }

            if ($rental->security_deposit_status !== 'held') {
                throw ValidationException::withMessages([
                    'deposit' => ['No held security deposit available.'],
                ]);
            }

            // Reserve portion earmarked for damage forfeit
            $damageReserved = $rental->damage_settlement_status === 'forfeited'
                ? round((float) ($rental->actual_repair_cost ?? 0), 2)
                : 0.0;

            $depositPaid = (float) $rental->deposit_paid;
            $alreadyApplied = round((float) ($rental->deposit_applied_to_balance ?? 0), 2);
            $cancDeduction = round((float) ($rental->cancellation_deposit_deduction ?? 0), 2);

            $available = round(max(0.0, $depositPaid - $alreadyApplied - $cancDeduction - $damageReserved), 2);

            if ($available <= 0) {
                throw ValidationException::withMessages([
                    'deposit' => ['No deposit available to apply to balance.'],
                ]);
            }

            $amountDue = round(
                max(0.0,
                    (float) $rental->total_cost
                    + (float) ($rental->overdue_fee ?? 0)
                    + (float) ($rental->late_pickup_fee ?? 0)
                    + (float) ($rental->early_return_charge ?? 0)
                    - (float) ($rental->early_return_refund ?? 0)
                    - (float) $rental->amount_paid
                    - $alreadyApplied
                ),
                2
            );

            if ($amountDue <= 0) {
                throw ValidationException::withMessages([
                    'balance' => ['No outstanding balance to settle.'],
                ]);
            }

            $apply = round(min($available, $amountDue), 2);
            $newApplied = round($alreadyApplied + $apply, 2);
            $newAmountDue = round(max(0.0, $amountDue - $apply), 2);

            // Mark deposit forfeited when fully consumed (applied + cancellation + damage >= paid)
            $totalConsumed = $newApplied + $cancDeduction + $damageReserved;
            $depositFullyConsumed = round($totalConsumed, 2) >= round($depositPaid, 2);

            $settled = $this->repository->updateRental($id, [
                'deposit_applied_to_balance' => $newApplied,
                'security_deposit_status' => $depositFullyConsumed ? 'forfeited' : $rental->security_deposit_status,
                'settlement_status' => $newAmountDue <= 0 ? 'settled' : $rental->settlement_status,
                'payment_status' => $newAmountDue <= 0 ? RentalPaymentStatus::Paid : RentalPaymentStatus::PartiallyPaid,
            ]);

            $settled->load('customer');
            $this->recordRefundTransaction($settled, $apply, TransactionType::SecurityDeposit, 'DEP-');

            return $settled;
        });
    }

    public function settleDamage(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            $outcome = $data['outcome']; // 'settled' or 'forfeited'
            $actualRepairCost = round((float) ($data['actual_repair_cost'] ?? 0), 2);
            $balanceCollectedNow = (bool) ($data['balance_collected_now'] ?? false);

            $updates = [
                'actual_repair_cost' => $actualRepairCost,
                'damage_settlement_status' => $outcome,
                'damage_balance_due' => null,
            ];

            if ($outcome === 'forfeited' && $rental->security_deposit_status === 'held') {
                $depositPaid = (float) $rental->deposit_paid;
                $alreadyApplied = (float) ($rental->deposit_applied_to_balance ?? 0);
                $cancDeduction = (float) ($rental->cancellation_deposit_deduction ?? 0);

                // Available deposit for damage coverage
                $availableForDamage = round(
                    max(0.0, $depositPaid - $alreadyApplied - $cancDeduction),
                    2
                );
                $shortfall = round(max(0.0, $actualRepairCost - $availableForDamage), 2);

                // Deposit fully consumed by this damage?
                $totalConsumed = round(min($actualRepairCost, $availableForDamage) + $alreadyApplied + $cancDeduction, 2);
                if ($totalConsumed >= round($depositPaid, 2)) {
                    $updates['security_deposit_status'] = 'forfeited';
                }

                if ($shortfall > 0) {
                    if ($balanceCollectedNow) {
                        // Admin collected the remainder right now - fully settled in one step
                        $updates['damage_settlement_status'] = 'settled';
                        $updates['damage_balance_due'] = null;
                    } else {
                        // Deposit covers what it can; remaining balance recorded as pending
                        $updates['damage_balance_due'] = $shortfall;
                    }
                }
            }

            $updated = $this->repository->updateRental($id, $updates);

            /*
             * If a pending RepairCost (estimate) transaction exists, update it with the actual cost
             * and mark it as paid - repair cost and damage charge are the same cost, just confirmed.
             * Otherwise create a new DamageCharge for the actual cost.
             */
            $pendingRepairTx = PaymentTransaction::where('transactable_type', 'rental')
                ->where('transactable_id', $rental->id)
                ->where('type', TransactionType::RepairCost->value)
                ->where('status', 'pending')
                ->first();

            if ($pendingRepairTx) {
                $pendingRepairTx->update([
                    'amount' => $actualRepairCost,
                    'status' => 'paid',
                    'paid_at' => now(),
                    'description' => TransactionType::RepairCost->label() . ' (actual) for rental ' . $rental->reference,
                    'processed_by_user_id' => auth()->id(),
                ]);
            } elseif ($actualRepairCost > 0) {
                $this->recordDamageTransaction($updated, $actualRepairCost, TransactionType::DamageCharge);
            }

            return $updated;
        });
    }

    public function recordRepairCost(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            if (! $rental->has_damage) {
                throw ValidationException::withMessages([
                    'damage' => ['No damage recorded for this rental.'],
                ]);
            }

            $cost = round((float) ($data['estimated_repair_cost'] ?? 0), 2);

            $updated = $this->repository->updateRental($id, [
                'estimated_repair_cost' => $cost,
            ]);

            if ($cost > 0) {
                /*
                 * If a pending RepairCost (estimate) transaction already exists,
                 * update its amount instead of creating a new transaction.
                 * This prevents duplicate estimate entries when the cost is revised.
                 */
                $existingEstimate = PaymentTransaction::query()
                    ->where('transactable_type', 'rental')
                    ->where('transactable_id', $id)
                    ->where('type', TransactionType::RepairCost->value)
                    ->where('status', 'pending')
                    ->latest()
                    ->first();

                if ($existingEstimate) {
                    $existingEstimate->update([
                        'amount' => $cost,
                        'description' => TransactionType::RepairCost->label() . ' (estimate updated) for rental ' . $rental->reference,
                    ]);
                } else {
                    /* RepairCost is an estimate - record as pending until damage is settled */
                    $this->recordDamageTransaction($updated, $cost, TransactionType::RepairCost, pending: true);
                }
            }

            return $updated;
        });
    }

    public function collectDamageBalance(string $id): Rental
    {
        return DB::transaction(function () use ($id) {
            $rental = $this->repository->findRental($id);

            $balanceDue = round((float) ($rental->damage_balance_due ?? 0), 2);

            if ($balanceDue <= 0) {
                throw ValidationException::withMessages([
                    'damage' => ['No outstanding damage balance to collect.'],
                ]);
            }

            $updated = $this->repository->updateRental($id, [
                'damage_balance_due' => null,
                'damage_settlement_status' => 'settled',
            ]);

            $this->recordDamageTransaction($updated, $balanceDue, TransactionType::DamageCharge);

            return $updated;
        });
    }

    public function collectDeposit(string $id): Rental
    {
        return DB::transaction(function () use ($id) {
            $rental = $this->repository->findRental($id);

            if ($rental->security_deposit_status !== 'pending') {
                throw ValidationException::withMessages([
                    'deposit' => ['Deposit has already been collected or is not applicable.'],
                ]);
            }

            if (! $rental->security_deposit_amount || $rental->security_deposit_amount <= 0) {
                throw ValidationException::withMessages([
                    'deposit' => ['No security deposit amount set for this rental.'],
                ]);
            }

            $updated = $this->repository->updateRental($id, [
                'deposit_paid' => $rental->security_deposit_amount,
                'security_deposit_status' => 'held',
                'deposit_collected_at' => now(),
                'deposit_collected_by' => auth()->id(),
            ]);

            $updated->load('customer');
            $this->recordRefundTransaction(
                $updated,
                round((float) $rental->security_deposit_amount, 2),
                TransactionType::SecurityDeposit,
                'DEP-'
            );

            return $updated;
        });
    }

    public function refundDeposit(string $id): Rental
    {
        return DB::transaction(function () use ($id) {
            $rental = $this->repository->findRental($id);

            $damageDeduction = ($rental->damage_settlement_status === 'forfeited')
                ? round((float) ($rental->actual_repair_cost ?? 0), 2)
                : 0;

            $netRefundable = round(
                max(0.0,
                    (float) $rental->deposit_paid
                    - (float) ($rental->deposit_applied_to_balance ?? 0)
                    - (float) ($rental->cancellation_deposit_deduction ?? 0)
                    - $damageDeduction
                ),
                2
            );

            $updated = $this->repository->updateRental($id, [
                'security_deposit_status' => 'refunded',
                'deposit_refunded' => $netRefundable,
                'deposit_refunded_at' => now(),
            ]);

            if ($netRefundable > 0) {
                $updated->load('customer');
                $this->recordRefundTransaction($updated, $netRefundable, TransactionType::DepositRefund, 'DEP-');
            }

            return $updated;
        });
    }

    public function waivedOverdue(string $id, string $reason): Rental
    {
        return DB::transaction(function () use ($id, $reason) {
            return $this->repository->updateRental($id, [
                'overdue_waived' => true,
                'overdue_waiver_reason' => $reason,
                'overdue_waived_by' => auth()->id(),
                'overdue_fee' => 0,
            ]);
        });
    }

    /* Rental Extension */
    public function getExtendPreview(string $id, string $newReturnDate): array
    {
        $rental = $this->repository->findRental($id);

        if (! in_array($rental->status, [RentalStatus::Pending, RentalStatus::Confirmed, RentalStatus::Active, RentalStatus::Overdue])) {
            throw ValidationException::withMessages([
                'status' => ['Rental cannot be extended in its current status.'],
            ]);
        }

        $newReturn = Carbon::parse($newReturnDate)->startOfDay();
        $currentReturn = $rental->return_date->copy()->startOfDay();

        if (! $newReturn->isAfter($currentReturn)) {
            throw ValidationException::withMessages([
                'new_return_date' => ['New return date must be after the current return date.'],
            ]);
        }

        $extensionDays = (int) $currentReturn->diffInDays($newReturn);
        $baseLine = collect($rental->applied_charges_breakdown ?? [])->firstWhere('type', 'base');
        $originalDays = (int) $rental->rental_days - (int) ($rental->extension_days ?? 0);
        $dailyRate = ($baseLine && $originalDays > 0)
            ? round((float) $baseLine['amount'] / $originalDays, 2)
            : round((float) $rental->daily_rate, 2);
        $extensionBase = round($dailyRate * $extensionDays, 2);

        $extensionExtras = 0.0;
        foreach ($rental->applied_charges_breakdown ?? [] as $item) {
            if (($item['type'] ?? '') === 'addon' && ($item['is_per_day'] ?? false) && isset($item['unit_rate'])) {
                $extensionExtras += (float) $item['unit_rate'] * $extensionDays;
            }
        }
        $extensionExtras = round($extensionExtras, 2);
        $extensionSubtotal = round($extensionBase + $extensionExtras, 2);

        $extensionVat = 0.0;
        if ($this->rentalSettings->vat_enabled && $this->rentalSettings->vat_rate > 0) {
            $extensionVat = round($extensionSubtotal * ($this->rentalSettings->vat_rate / 100), 2);
        }

        $extensionTotal = round($extensionSubtotal + $extensionVat, 2);
        $newTotal = round((float) $rental->total_cost + $extensionTotal, 2);
        $amountPaid = round((float) $rental->amount_paid, 2);
        $newAmountDue = round(max(0.0, $newTotal - $amountPaid - (float) ($rental->deposit_applied_to_balance ?? 0)), 2);

        // Compute live overdue charge that will be waived upon extension
        $liveOverdueWaived = $this->computeLiveOverdueCharge($rental);

        // Find next booking conflict for this vehicle
        [$maxExtendDate, $nextBookingStarts] = $this->findNextVehicleBooking($rental);

        return [
            'extension_days' => $extensionDays,
            'original_return_date' => $rental->return_date->format('Y-m-d'),
            'new_return_date' => $newReturn->format('Y-m-d'),
            'extension_base_cost' => $extensionBase,
            'extension_extras_cost' => $extensionExtras,
            'extension_vat' => $extensionVat,
            'extension_total' => $extensionTotal,
            'old_total_cost' => (float) $rental->total_cost,
            'new_total_cost' => $newTotal,
            'amount_paid' => $amountPaid,
            'new_amount_due' => $newAmountDue,
            'live_overdue_waived' => $liveOverdueWaived,
            'max_extend_date' => $maxExtendDate,
            'next_booking_starts' => $nextBookingStarts,
        ];
    }

    public function extendRental(string $id, array $data): Rental
    {
        return DB::transaction(function () use ($id, $data) {
            $rental = $this->repository->findRental($id);

            if (! in_array($rental->status, [RentalStatus::Pending, RentalStatus::Confirmed, RentalStatus::Active, RentalStatus::Overdue])) {
                throw ValidationException::withMessages([
                    'status' => ['Rental cannot be extended in its current status.'],
                ]);
            }

            $newReturn = Carbon::parse($data['new_return_date'])->startOfDay();
            $currentReturn = $rental->return_date->copy()->startOfDay();

            if (! $newReturn->isAfter($currentReturn)) {
                throw ValidationException::withMessages([
                    'new_return_date' => ['New return date must be after the current return date.'],
                ]);
            }

            // Guard against overlapping a future booking for the same vehicle
            $nextPickup = Rental::where('vehicle_id', $rental->vehicle_id)
                ->where('id', '!=', $rental->id)
                ->whereIn('status', ['pending', 'confirmed', 'active', 'overdue'])
                ->where('pickup_date', '>', $rental->return_date)
                ->orderBy('pickup_date')
                ->value('pickup_date');

            if ($nextPickup && $newReturn->gte(Carbon::parse($nextPickup)->startOfDay())) {
                $maxDate = Carbon::parse($nextPickup)->subDay()->format('Y-m-d');
                throw ValidationException::withMessages([
                    'new_return_date' => ['Cannot extend past ' . $maxDate . ' - another booking starts on ' . $nextPickup . '.'],
                ]);
            }

            $extensionDays = (int) $currentReturn->diffInDays($newReturn);
            $breakdown = $rental->applied_charges_breakdown ?? [];
            $baseLine = collect($breakdown)->firstWhere('type', 'base');
            $originalDays = (int) $rental->rental_days - (int) ($rental->extension_days ?? 0);
            $dailyRate = ($baseLine && $originalDays > 0)
                ? round((float) $baseLine['amount'] / $originalDays, 2)
                : round((float) $rental->daily_rate, 2);
            $extensionBase = round($dailyRate * $extensionDays, 2);
            $extensionExtras = 0.0;
            $extensionAddonLines = [];

            foreach ($breakdown as $item) {
                if (($item['type'] ?? '') === 'addon' && ($item['is_per_day'] ?? false) && isset($item['unit_rate'])) {
                    $addonExt = round((float) $item['unit_rate'] * $extensionDays, 2);
                    $extensionExtras += $addonExt;
                    $extensionAddonLines[] = [
                        'label' => 'Extension – ' . ($item['label'] ?? 'Add-on') . ' (' . $extensionDays . 'd × ' . number_format((float) $item['unit_rate'], 2) . '/day)',
                        'amount' => $addonExt,
                        'type' => 'extension_addon',
                    ];
                }
            }
            $extensionExtras = round($extensionExtras, 2);
            $extensionSubtotal = round($extensionBase + $extensionExtras, 2);

            $extensionVat = 0.0;
            if ($this->rentalSettings->vat_enabled && $this->rentalSettings->vat_rate > 0) {
                $extensionVat = round($extensionSubtotal * ($this->rentalSettings->vat_rate / 100), 2);
            }

            $extensionTotal = round($extensionSubtotal + $extensionVat, 2);

            // Insert extension lines before tax/deposit lines in breakdown
            $extensionLines = array_merge(
                [[
                    'label' => 'Extension (' . $extensionDays . 'd × ' . number_format($dailyRate, 2) . '/day)',
                    'amount' => $extensionBase,
                    'type' => 'extension',
                    'extension_days' => $extensionDays,
                ]],
                $extensionAddonLines
            );

            $insertAt = count($breakdown);
            foreach ($breakdown as $i => $line) {
                if (in_array($line['type'] ?? '', ['tax', 'deposit'])) {
                    $insertAt = $i;
                    break;
                }
            }
            array_splice($breakdown, $insertAt, 0, $extensionLines);

            // Update existing tax line amount
            if ($extensionVat > 0) {
                foreach ($breakdown as &$line) {
                    if (($line['type'] ?? '') === 'tax') {
                        $line['amount'] = round((float) $line['amount'] + $extensionVat, 2);
                        break;
                    }
                }
                unset($line);
            }

            $newTotal = round((float) $rental->total_cost + $extensionTotal, 2);
            $reason = ! empty($data['reason']) ? ' Reason: ' . $data['reason'] : '';
            $note = "\n[" . now()->format('Y-m-d H:i') . '] Extended by ' . $extensionDays . ' day(s) to ' . $newReturn->format('Y-m-d') . '.' . $reason;

            $updatePayload = [
                'return_date' => $newReturn->format('Y-m-d'),
                'rental_days' => (int) $rental->rental_days + $extensionDays,
                'extension_days' => (int) ($rental->extension_days ?? 0) + $extensionDays,
                'original_return_date' => $rental->original_return_date
                    ? $rental->original_return_date->format('Y-m-d')
                    : $rental->return_date->format('Y-m-d'),
                'base_cost' => round((float) $rental->base_cost + $extensionBase, 2),
                'extras_cost' => round((float) $rental->extras_cost + $extensionExtras, 2),
                'additional_charges' => round((float) $rental->additional_charges + $extensionExtras, 2),
                'subtotal' => round((float) $rental->subtotal + $extensionSubtotal, 2),
                'vat_amount' => $extensionVat > 0
                    ? round((float) ($rental->vat_amount ?? 0) + $extensionVat, 2)
                    : $rental->vat_amount,
                'total_cost' => $newTotal,
                'applied_charges_breakdown' => $breakdown,
                'admin_notes' => trim(($rental->admin_notes ?? '') . $note),
            ];

            // Extension on an overdue rental resets it to active - live overdue charge is forgiven
            if ($rental->status === RentalStatus::Overdue) {
                $updatePayload['status'] = RentalStatus::Active;
            }

            // If the rental was fully paid, the extension creates a new balance due - demote to partially paid
            if ($rental->payment_status === RentalPaymentStatus::Paid && $extensionTotal > 0) {
                $updatePayload['payment_status'] = RentalPaymentStatus::PartiallyPaid;
            }

            return $this->repository->updateRental($id, $updatePayload);
        });
    }

    public function sendPaymentLink(Rental $rental): void
    {
        $rental->loadMissing(['customer']);

        $amountDue = $this->paymentService->resolvePayableAmount('rental', $rental->id);

        if ($amountDue <= 0) {
            throw ValidationException::withMessages([
                'payment' => ['This rental has no outstanding balance.'],
            ]);
        }

        $email = $rental->customer?->email;
        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        $customer = $rental->customer;
        $queryParams = http_build_query(array_filter([
            'name' => $customer?->name,
            'email' => $customer?->email,
            'phone' => $customer?->phone,
            'booking_ref' => $rental->reference,
        ]));

        $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/rental/' . $rental->id . '?' . $queryParams;

        Mail::to($email)->queue(new PaymentLinkMail($rental, $paymentUrl, $amountDue));
    }

    /**
     * Send a payment link specifically for the damage/repair cost outstanding on a rental.
     * The email states the damage amount; the payment flow settles against the rental balance.
     */
    public function sendDamagePaymentLink(Rental $rental): void
    {
        $rental->loadMissing(['customer']);

        /* Use damage_balance_due if set; fall back to estimated_repair_cost (pending estimate) */
        $damageAmount = round(
            (float) ($rental->damage_balance_due
                ?? $rental->estimated_repair_cost
                ?? 0),
            2
        );

        if ($damageAmount <= 0) {
            throw ValidationException::withMessages([
                'payment' => ['No outstanding damage or repair cost to send a payment link for.'],
            ]);
        }

        $email = $rental->customer?->email;
        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        $customer = $rental->customer;
        $queryParams = http_build_query(array_filter([
            'name' => $customer?->name,
            'email' => $customer?->email,
            'phone' => $customer?->phone,
            'booking_ref' => $rental->reference,
            'purpose' => 'damage',
        ]));

        $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/rental/' . $rental->id . '?' . $queryParams;

        Mail::to($email)->queue(new BookingPaymentLinkMail(
            customerName: $customer?->name ?? 'Customer',
            reference: $rental->reference,
            amountDue: $damageAmount,
            paymentUrl: $paymentUrl,
            bookingType: 'Damage/Repair Cost',
            currencySymbol: $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ));
    }

    /**
     * Send a payment link for the security deposit on a confirmed or active rental.
     */
    public function sendSecurityDepositPaymentLink(Rental $rental): void
    {
        $rental->loadMissing(['customer']);

        $depositAmount = round((float) ($rental->security_deposit_amount ?? 0), 2);

        if ($depositAmount <= 0) {
            throw ValidationException::withMessages([
                'payment' => ['This rental has no security deposit amount to collect.'],
            ]);
        }

        if ($rental->deposit_waived || $rental->skip_security_deposit) {
            throw ValidationException::withMessages([
                'payment' => ['Security deposit has been waived for this rental.'],
            ]);
        }

        if (! in_array($rental->status, [RentalStatus::Confirmed, RentalStatus::Active], true)) {
            throw ValidationException::withMessages([
                'payment' => ['Security deposit payment link can only be sent for confirmed or active rentals.'],
            ]);
        }

        $email = $rental->customer?->email;
        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        $customer = $rental->customer;
        $queryParams = http_build_query(array_filter([
            'name' => $customer?->name,
            'email' => $customer?->email,
            'phone' => $customer?->phone,
            'booking_ref' => $rental->reference,
            'purpose' => 'deposit',
        ]));

        $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/rental/' . $rental->id . '?' . $queryParams;

        Mail::to($email)->queue(new BookingPaymentLinkMail(
            customerName: $customer?->name ?? 'Customer',
            reference: $rental->reference,
            amountDue: $depositAmount,
            paymentUrl: $paymentUrl,
            bookingType: 'Security Deposit',
            currencySymbol: $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ));
    }

    public function sendInvoiceToCustomer(Rental $rental, ?string $note = null): void
    {
        $rental->loadMissing([
            'customer',
            'vehicle.category',
            'vehicle.branch',
            'pickupLocation',
            'dropoffLocation',
        ]);

        $email = $rental->customer?->email;

        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        Mail::to($email)->queue(new RentalInvoiceMail($rental, $note));
    }

    public function confirmPaidPendingForCustomer(Customer $customer): int
    {
        $rentals = $customer->rentals()
            ->where('status', RentalStatus::Pending->value)
            ->where('payment_status', RentalPaymentStatus::Paid->value)
            ->get();

        foreach ($rentals as $rental) {
            $oldStatus = $rental->status->value;
            $rental->update(['status' => RentalStatus::Confirmed->value]);
            event(new RentalStatusChanged($rental->fresh(), $oldStatus, RentalStatus::Confirmed->value));
        }

        return $rentals->count();
    }

    public function attachPickupVideos(Rental $rental, array $files): Rental
    {
        foreach ($files as $file) {
            $media = $rental->addMedia($file)->toMediaCollection('pickup_video');
            ProcessRentalVideoJob::dispatch($media->id);
        }

        return $rental->fresh();
    }

    public function attachReturnVideos(Rental $rental, array $files): Rental
    {
        foreach ($files as $file) {
            $media = $rental->addMedia($file)->toMediaCollection('return_video');
            ProcessRentalVideoJob::dispatch($media->id);
        }

        return $rental->fresh();
    }

    /**
     * Record a refund, deposit, or cancellation transaction for a rental.
     * Use this for non-manual-payment monetary events (refunds, deposits, cancellation fees).
     */
    private function recordRefundTransaction(
        Rental $rental,
        float $amount,
        TransactionType $type,
        string $referencePrefix = 'REF-'
    ): void {
        $customer = $rental->customer;

        PaymentTransaction::create([
            'reference' => $referencePrefix . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => null,
            'type' => $type->value,
            'amount' => $amount,
            'currency' => $rental->currency ?? 'GHS',
            'currency_symbol' => $rental->currency_symbol ?? null,
            'exchange_rate' => $rental->exchange_rate ?? null,
            'status' => 'paid',
            'paid_at' => now(),
            'description' => $type->label() . ' for rental ' . $rental->reference,
            'payer_name' => $customer?->name ?? 'Unknown',
            'payer_email' => $customer?->email ?? '',
            'payer_phone' => $customer?->phone ?? '',
            'transactable_type' => 'rental',
            'transactable_id' => $rental->id,
            'branch_id' => $rental->branch_id,
            'processed_by_user_id' => auth()->id(),
        ]);
    }

    /**
     * Record a manual payment transaction for a rental.
     *
     * @param  array<string, mixed>  $data
     */
    private function recordDamageTransaction(Rental $rental, float $amount, TransactionType $type, bool $pending = false): void
    {
        $customer = $rental->customer;

        PaymentTransaction::create([
            'reference' => 'DMG-' . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => null,
            'type' => $type->value,
            'amount' => $amount,
            'currency' => $rental->currency ?? 'GHS',
            'currency_symbol' => $rental->currency_symbol ?? null,
            'exchange_rate' => $rental->exchange_rate ?? null,
            'status' => $pending ? 'pending' : 'paid',
            'paid_at' => $pending ? null : now(),
            'description' => $type->label() . ' for rental ' . $rental->reference,
            'payer_name' => $customer?->name ?? 'Unknown',
            'payer_email' => $customer?->email ?? '',
            'payer_phone' => $customer?->phone ?? '',
            'transactable_type' => 'rental',
            'transactable_id' => $rental->id,
            'branch_id' => $rental->branch_id,
            'processed_by_user_id' => auth()->id(),
        ]);
    }

    private function recordManualTransaction(Rental $rental, float $amount, array $data, TransactionType $type = TransactionType::PartPayment): void
    {
        $customer = $rental->customer;

        $couponUsage = $rental->couponUsages()->latest()->first();
        $discountRuleUsage = $rental->discountUsages()->latest()->first();

        $discountReason = null;

        if ($couponUsage && $discountRuleUsage) {
            $discountReason = "Coupon: {$couponUsage->coupon?->name} + Rule: {$discountRuleUsage->discountRule?->name}";
        } elseif ($couponUsage) {
            $discountReason = "Coupon: {$couponUsage->coupon?->name}";
        } elseif ($discountRuleUsage) {
            $discountReason = "Rule: {$discountRuleUsage->discountRule?->name}";
        }

        $rawMethod = $data['payment_method'] ?? null;
        $channel = $this->resolvePaymentChannel($rawMethod);

        PaymentTransaction::create([
            'reference' => 'MAN-' . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => $channel,
            'payment_phone' => $data['payment_phone'] ?? null,
            'type' => $type->value,
            'amount' => $amount,
            'currency' => $rental->currency ?? 'GHS',
            'currency_symbol' => $rental->currency_symbol ?? null,
            'exchange_rate' => $rental->exchange_rate ?? null,
            'status' => 'paid',
            'paid_at' => now(),
            'description' => $data['notes'] ?? null,
            'payer_name' => $customer?->name ?? 'Unknown',
            'payer_email' => $customer?->email ?? '',
            'payer_phone' => $customer?->phone ?? '',
            'transactable_type' => 'rental',
            'transactable_id' => $rental->id,
            'branch_id' => $rental->branch_id,
            'processed_by_user_id' => auth()->id(),
            'discount_amount' => (float) ($rental->total_discount_amount ?? 0) > 0
                ? (float) $rental->total_discount_amount
                : null,
            'discount_reason' => $discountReason,
            'coupon_usage_id' => $couponUsage?->id,
            'discount_rule_usage_id' => $discountRuleUsage?->id,
        ]);
    }

    /* Helpers */
    /**
     * Map a raw payment_method string to a standardised channel value.
     */
    private function resolvePaymentChannel(?string $method): ?string
    {
        return match (strtolower((string) $method)) {
            'momo', 'mobile_money', 'mobilemoney' => 'momo',
            'card', 'credit_card', 'debit_card' => 'card',
            'cash' => 'cash',
            'bank_transfer', 'offline_transfer', 'bank' => 'bank_transfer',
            'online' => 'online',
            default => $method ? strtolower(trim((string) $method)) : null,
        };
    }

    /**
     * Compute the live overdue charge currently accruing on an overdue rental.
     * Returns 0.0 if the rental is not live-overdue.
     */
    private function computeLiveOverdueCharge(Rental $rental): float
    {
        if ($rental->status !== RentalStatus::Overdue || $rental->actual_return_date !== null) {
            return 0.0;
        }

        $overdueSettings = app(OverdueSettings::class);
        $scheduledReturn = Carbon::parse(
            $rental->return_date->format('Y-m-d') . ' ' . ($rental->return_time ?? '00:00:00')
        );
        $overdueStart = $overdueSettings->overdue_start_type === 'grace_period'
            ? $scheduledReturn->copy()->addMinutes($overdueSettings->grace_period_minutes)
            : $scheduledReturn->copy();

        $minutes = max(0, (int) $overdueStart->diffInMinutes(now(), false));

        if ($minutes <= 0) {
            return 0.0;
        }

        $thresholdMins = $overdueSettings->overdue_threshold_hours * 60;
        $vehicle = $rental->vehicle;

        if ($vehicle) {
            $vehicle->loadMissing('category');
        }

        if ($minutes <= $thresholdMins) {
            $rate = (float) ($vehicle?->overdue_daily_rate
                ?? $vehicle?->category?->overdue_daily_rate
                ?? $overdueSettings->overdue_hourly_rate);
            $units = (int) ceil($minutes / 60);
        } else {
            $rate = (float) ($vehicle?->daily_rate ?? $rental->daily_rate);
            $units = (int) ceil($minutes / 1440);
        }

        return round($rate * $units, 2);
    }

    /**
     * Find the next rental for the same vehicle after the current return date.
     * Returns [maxExtendDate, nextBookingStarts] - both null if no conflict.
     *
     * @return array{?string, ?string}
     */
    private function findNextVehicleBooking(Rental $rental): array
    {
        $nextPickup = Rental::where('vehicle_id', $rental->vehicle_id)
            ->where('id', '!=', $rental->id)
            ->whereIn('status', ['pending', 'confirmed', 'active', 'overdue'])
            ->where('pickup_date', '>', $rental->return_date)
            ->orderBy('pickup_date')
            ->value('pickup_date');

        if (! $nextPickup) {
            return [null, null];
        }

        $maxExtendDate = Carbon::parse($nextPickup)->subDay()->format('Y-m-d');

        return [$maxExtendDate, $nextPickup instanceof \Carbon\Carbon ? $nextPickup->format('Y-m-d') : (string) $nextPickup];
    }

    private function depositStatusForCreate(RentalData $data, float $depositAmount): ?string
    {
        if ($depositAmount <= 0 || $data->skipSecurityDeposit) {
            return null;
        }

        return $data->collectDepositNow ? 'held' : 'pending';
    }
}
