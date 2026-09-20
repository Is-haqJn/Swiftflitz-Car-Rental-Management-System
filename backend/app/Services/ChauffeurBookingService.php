<?php

namespace App\Services;

use App\DTOs\ChauffeurBookingData;
use App\Enums\ChauffeurBookingStatus;
use App\Enums\ChauffeurPaymentStatus;
use App\Enums\CouponScopeType;
use App\Enums\FleetVehicleStatus;
use App\Enums\TransactionType;
use App\Events\ChauffeurBookingCancelled;
use App\Events\ChauffeurBookingCreated;
use App\Events\ChauffeurBookingStatusChanged;
use App\Jobs\SendChauffeurBookingDocumentJob;
use App\Jobs\SendChauffeurRefundMailJob;
use App\Mail\BookingPaymentLinkMail;
use App\Mail\ChauffeurDriverAssignmentMail;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\ChauffeurLocation;
use App\Models\DiscountCoupon;
use App\Models\Driver;
use App\Models\FleetServiceAssignment;
use App\Models\FleetVehicle;
use App\Models\PaymentTransaction;
use App\Repositories\Contracts\ChauffeurBookingRepositoryInterface;
use App\Services\Contracts\ChauffeurBookingServiceInterface;
use App\Services\Contracts\ChauffeurCustomerServiceInterface;
use App\Services\Contracts\ChauffeurPricingServiceInterface;
use App\Services\Contracts\DriverAvailabilityServiceInterface;
use App\Settings\ChauffeurSettings;
use App\Settings\GeneralSettings;
use App\Support\CurrencyHelper;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChauffeurBookingService implements ChauffeurBookingServiceInterface
{
    public function __construct(
        protected ChauffeurBookingRepositoryInterface $bookingRepository,
        protected ChauffeurCustomerServiceInterface $customerService,
        protected ChauffeurPricingServiceInterface $pricingService,
        protected ChauffeurSettings $chauffeurSettings,
        protected DriverAvailabilityServiceInterface $driverAvailability,
        protected GeneralSettings $generalSettings,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->bookingRepository->getAll($perPage);
    }

    public function getBooking(string $id): ChauffeurBooking
    {
        return $this->bookingRepository->findBooking($id);
    }

    public function create(ChauffeurBookingData $data): ChauffeurBooking
    {
        $booking = DB::transaction(function () use ($data) {
            $assignment = FleetServiceAssignment::where('vehicle_id', $data->vehicleId)
                ->where('service_type', 'chauffeur')
                ->where('is_active', true)
                ->firstOrFail();

            $pickupLocation = $data->pickupLocationId
                ? ChauffeurLocation::findOrFail($data->pickupLocationId)
                : null;

            $coupon = $data->couponCode
                ? DiscountCoupon::where('code', $data->couponCode)->with('scopes')->first()
                : null;

            if ($coupon && ! $coupon->appliesToAny([
                [CouponScopeType::Chauffeur, null],
                [CouponScopeType::FleetVehicle, (string) $data->vehicleId],
                [CouponScopeType::Category, $assignment->category_id ? (string) $assignment->category_id : null],
            ])) {
                $coupon = null;
            }

            $pricing = $this->pricingService->calculate($assignment, $pickupLocation, $coupon);

            $customer = $this->customerService->findOrCreate(
                $data->customerFullName,
                $data->customerEmail,
                $data->customerPhone,
                $data->expectedDestination,
            );

            $isInStorePayment = $data->paymentMethod !== null && $data->paymentMethod !== 'website';
            $paymentStatus = $isInStorePayment ? ChauffeurPaymentStatus::Paid : ChauffeurPaymentStatus::Pending;
            $bookingStatus = ChauffeurBookingStatus::Pending;

            if ($pricing->total <= 0) {
                $paymentStatus = ChauffeurPaymentStatus::Paid;
            }

            $returnTime = $data->returnTime
                ?? Carbon::parse($data->pickupTime)
                    ->setTimeFromTimeString($this->chauffeurSettings->standard_return_time)
                    ->toDateTimeString();

            // Resolve driver: use explicitly passed driver, or auto-assign from vehicle default
            $resolvedDriverId = $data->driverId;
            $autoAssigned = false;

            if ($resolvedDriverId === null && $data->vehicleId !== null) {
                $vehicle = FleetVehicle::find($data->vehicleId);

                if ($vehicle && $vehicle->default_driver_id !== null) {
                    $pickupCarbon = Carbon::parse($data->pickupTime);
                    $returnCarbon = Carbon::parse($returnTime);

                    if (! $this->driverAvailability->hasConflict($vehicle->default_driver_id, $pickupCarbon, $returnCarbon)) {
                        $resolvedDriverId = $vehicle->default_driver_id;
                        $bookingStatus = ChauffeurBookingStatus::DriverAssigned;
                        $autoAssigned = true;
                    } elseif ($vehicle->is_personal_vehicle) {
                        throw ValidationException::withMessages([
                            'vehicle_id' => ['Vehicle unavailable - the assigned driver has a conflicting booking at this time.'],
                        ]);
                    }
                }
            }

            $bookingBranch = $data->branchId ? Branch::find($data->branchId) : null;
            $currencySnapshot = CurrencyHelper::resolveForBranch($bookingBranch, $this->generalSettings);

            $newBooking = $this->bookingRepository->createBooking(array_merge(
                [
                    'booking_reference' => $this->bookingRepository->generateReference(),
                    'branch_id' => $data->branchId,
                    'vehicle_id' => $data->vehicleId,
                    'driver_id' => $resolvedDriverId,
                    'chauffeur_customer_id' => $customer->id,
                    'pickup_location_id' => $data->pickupLocationId,
                    'pickup_time' => $data->pickupTime,
                    'return_time' => $returnTime,
                    'payment_status' => $paymentStatus->value,
                    'payment_method' => $data->paymentMethod,
                    'payment_reference' => $data->paymentReference,
                    'booking_status' => $bookingStatus->value,
                    'staff_notes' => $data->staffNotes,
                    'created_by' => auth()->id(),
                    'currency' => $currencySnapshot['code'],
                    'currency_symbol' => $currencySnapshot['symbol'],
                    'exchange_rate' => $currencySnapshot['is_custom'] ? $currencySnapshot['rate'] : null,
                ],
                $pricing->toSnapshot(),
            ));

            $newBooking->bookingRecords()->create([
                'action' => 'created',
                'performed_by' => auth()->id(),
                'notes' => $autoAssigned ? 'Booking created. Default driver auto-assigned.' : 'Booking created.',
            ]);

            return $this->bookingRepository->findBooking($newBooking->id);
        });

        $variant = $data->paymentMethod !== null ? 'receipt' : 'invoice';
        /* Send document to driver only on creation; customer receives the receipt with the payment confirmation email */
        SendChauffeurBookingDocumentJob::dispatch($booking, $variant, 'driver');

        ChauffeurBookingCreated::dispatch($booking);

        return $booking;
    }

    public function update(string $id, array $data): ChauffeurBooking
    {
        return $this->bookingRepository->updateBooking($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->bookingRepository->deleteBooking($id);
    }

    public function confirmBooking(string $id): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== ChauffeurBookingStatus::Pending) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only pending bookings can be confirmed.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => ChauffeurBookingStatus::Confirmed->value,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'confirmed',
            'performed_by' => auth()->id(),
        ]);

        ChauffeurBookingStatusChanged::dispatch($updated, ChauffeurBookingStatus::Pending->value);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function assignDriver(string $id, array $data): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $assignableStatuses = [ChauffeurBookingStatus::Confirmed, ChauffeurBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $assignableStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only confirmed or driver-assigned bookings can have a driver assigned.'],
            ]);
        }

        $oldStatus = $booking->booking_status->value;

        $update = ['booking_status' => ChauffeurBookingStatus::DriverAssigned->value];

        $targetVehicleId = $data['vehicle_id'] ?? $booking->vehicle_id;

        if (! empty($data['vehicle_id'])) {
            $vehicle = FleetVehicle::findOrFail($data['vehicle_id']);

            if ($vehicle->status !== FleetVehicleStatus::Available || ! $vehicle->is_active) {
                throw ValidationException::withMessages([
                    'vehicle_id' => ['The selected vehicle is not currently available.'],
                ]);
            }

            $update['vehicle_id'] = $vehicle->id;
            $targetVehicleId = $vehicle->id;
        }

        if (! empty($data['driver_id'])) {
            $driver = Driver::findOrFail($data['driver_id']);

            if (! $driver->is_available) {
                throw ValidationException::withMessages([
                    'driver_id' => ['The selected driver is not currently available.'],
                ]);
            }

            // Enforce personal vehicle coupling
            if ($targetVehicleId !== null) {
                $targetVehicle = isset($vehicle) ? $vehicle : FleetVehicle::find($targetVehicleId);

                if (
                    $targetVehicle
                    && $targetVehicle->is_personal_vehicle
                    && $targetVehicle->default_driver_id !== null
                    && $targetVehicle->default_driver_id !== $driver->id
                ) {
                    throw ValidationException::withMessages([
                        'driver_id' => ['This vehicle can only be driven by its assigned driver.'],
                    ]);
                }
            }

            $pickupCarbon = Carbon::parse($booking->pickup_time);
            $returnCarbon = Carbon::parse($booking->return_time);

            if ($this->driverAvailability->hasConflict($driver->id, $pickupCarbon, $returnCarbon, $booking->id)) {
                throw ValidationException::withMessages([
                    'driver_id' => ['The selected driver has a conflicting booking at this time.'],
                ]);
            }

            $update['driver_id'] = $driver->id;
        }

        $updated = $this->bookingRepository->updateBooking($id, $update);

        $updated->bookingRecords()->create([
            'action' => 'driver_assigned',
            'performed_by' => auth()->id(),
        ]);

        $fresh = $updated->fresh(['bookingRecords.performedBy', 'chauffeurCustomer', 'vehicle', 'driver', 'pickupLocation']);

        if ($fresh->driver?->email) {
            Mail::to($fresh->driver->email)
                ->queue(new ChauffeurDriverAssignmentMail($fresh));
        }

        ChauffeurBookingStatusChanged::dispatch($updated, $oldStatus);

        return $fresh;
    }

    public function removeDriver(string $id): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== ChauffeurBookingStatus::DriverAssigned) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only driver-assigned bookings can have the driver removed.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'driver_id' => null,
            'booking_status' => ChauffeurBookingStatus::Confirmed->value,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'driver_removed',
            'performed_by' => auth()->id(),
        ]);

        ChauffeurBookingStatusChanged::dispatch($updated, ChauffeurBookingStatus::DriverAssigned->value);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function startTrip(string $id): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $allowedStatuses = [ChauffeurBookingStatus::Confirmed, ChauffeurBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $allowedStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['The trip cannot be started from its current status.'],
            ]);
        }

        $oldStatus = $booking->booking_status->value;

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => ChauffeurBookingStatus::InProgress->value,
            'actual_pickup_time' => now(),
        ]);

        $updated->bookingRecords()->create([
            'action' => 'trip_started',
            'performed_by' => auth()->id(),
        ]);

        ChauffeurBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function completeTrip(string $id): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== ChauffeurBookingStatus::InProgress) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only in-progress trips can be completed.'],
            ]);
        }

        $actualReturn = $booking->actual_return_time
            ? Carbon::parse($booking->actual_return_time)
            : now();

        [$overtimeHours, $overtimeCharge] = $this->pricingService->calculateOvertime($booking, $actualReturn);
        $newTotal = round((float) $booking->total_amount + $overtimeCharge, 2);

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => ChauffeurBookingStatus::Completed->value,
            'actual_return_time' => $booking->actual_return_time ?? now(),
            'overtime_hours' => $overtimeHours,
            'overtime_charge' => $overtimeCharge,
            'total_amount' => $newTotal,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'trip_completed',
            'performed_by' => auth()->id(),
            'notes' => $overtimeHours > 0 ? "Overtime: {$overtimeHours}h - charge: {$overtimeCharge}" : null,
        ]);

        ChauffeurBookingStatusChanged::dispatch($updated, ChauffeurBookingStatus::InProgress->value);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function cancelBooking(string $id, array $data): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $cancellableStatuses = [
            ChauffeurBookingStatus::Pending,
            ChauffeurBookingStatus::Confirmed,
            ChauffeurBookingStatus::DriverAssigned,
        ];

        if (! in_array($booking->booking_status, $cancellableStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['This booking cannot be cancelled from its current status.'],
            ]);
        }

        $cancellationFee = (float) $this->chauffeurSettings->cancellation_flat_fee;

        $paymentStatus = $booking->payment_status;
        if ($cancellationFee === 0.0 && $booking->payment_status === ChauffeurPaymentStatus::Paid) {
            $paymentStatus = ChauffeurPaymentStatus::Refunded;
        }

        $oldStatus = $booking->booking_status->value;

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => ChauffeurBookingStatus::Cancelled->value,
            'payment_status' => $paymentStatus->value,
            'cancellation_fee_applied' => $cancellationFee,
            'cancelled_at' => now(),
            'cancelled_by' => auth()->id(),
        ]);

        $updated->bookingRecords()->create([
            'action' => 'cancelled',
            'performed_by' => auth()->id(),
            'notes' => $data['notes'] ?? null,
        ]);

        ChauffeurBookingCancelled::dispatch($updated);
        ChauffeurBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function markNoShow(string $id): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $allowedStatuses = [ChauffeurBookingStatus::Confirmed, ChauffeurBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $allowedStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['No-show can only be recorded for confirmed or driver-assigned bookings.'],
            ]);
        }

        $noShowFee = (float) $this->chauffeurSettings->no_show_fee;

        $oldStatus = $booking->booking_status->value;

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => ChauffeurBookingStatus::NoShow->value,
            'no_show_fee_applied' => $noShowFee,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'no_show',
            'performed_by' => auth()->id(),
        ]);

        ChauffeurBookingCancelled::dispatch($updated);
        ChauffeurBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function recordPayment(string $id, array $data): ChauffeurBooking
    {
        $booking = $this->bookingRepository->updateBooking($id, [
            'payment_method' => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'payment_status' => ChauffeurPaymentStatus::Paid->value,
        ]);

        PaymentTransaction::create([
            'reference' => 'MAN-' . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => $this->resolvePaymentChannel($data['payment_method'] ?? null),
            'payment_phone' => $data['payment_phone'] ?? null,
            'type' => TransactionType::ManualPayment->value,
            'amount' => (float) $booking->total_amount,
            'currency' => $booking->currency ?? 'GHS',
            'currency_symbol' => $booking->currency_symbol ?? null,
            'exchange_rate' => $booking->exchange_rate ?? null,
            'status' => 'paid',
            'paid_at' => now(),
            'description' => $data['payment_reference'] ?? null,
            'payer_name' => $booking->chauffeurCustomer?->full_name ?? $booking->chauffeurCustomer?->name ?? 'Unknown',
            'payer_email' => $booking->chauffeurCustomer?->email ?? '',
            'payer_phone' => $booking->chauffeurCustomer?->phone ?? '',
            'transactable_type' => 'chauffeur_booking',
            'transactable_id' => $booking->id,
            'branch_id' => $booking->branch_id,
            'processed_by_user_id' => auth()->id(),
        ]);

        SendChauffeurBookingDocumentJob::dispatch($booking, 'receipt');

        return $booking;
    }

    public function approveRefund(string $id, ?string $note = null): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== ChauffeurBookingStatus::Cancelled) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only cancelled bookings can be refunded.'],
            ]);
        }

        if ($booking->payment_status !== ChauffeurPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment_status' => ['Only bookings with a paid status can be refunded.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'payment_status' => ChauffeurPaymentStatus::Refunded->value,
            'refund_note' => $note,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'refund_approved',
            'notes' => $note,
            'performed_by' => auth()->id(),
        ]);

        SendChauffeurRefundMailJob::dispatch($updated->fresh());

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function waiveRefund(string $id, ?string $note = null): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== ChauffeurBookingStatus::Cancelled) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only cancelled bookings can have a refund waived.'],
            ]);
        }

        if ($booking->payment_status !== ChauffeurPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment_status' => ['Only bookings with a paid status can have a refund waived.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'payment_status' => ChauffeurPaymentStatus::Waived->value,
            'refund_note' => $note,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'refund_waived',
            'notes' => $note,
            'performed_by' => auth()->id(),
        ]);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function logPickup(string $id, array $data): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->pickupLog) {
            throw ValidationException::withMessages([
                'pickup_log' => ['A pickup log has already been recorded for this booking.'],
            ]);
        }

        $booking->pickupLog()->create([
            'confirmed_at' => $data['confirmed_at'] ?? now()->toDateTimeString(),
            'pickup_location' => $data['pickup_location'] ?? null,
            'odometer_reading' => $data['odometer_reading'] ?? null,
            'customer_present' => $data['customer_present'] ?? true,
            'driver_notes' => $data['driver_notes'] ?? null,
            'confirmed_by' => auth()->id(),
        ]);

        $booking->bookingRecords()->create([
            'action' => 'pickup_logged',
            'performed_by' => auth()->id(),
        ]);

        // TODO: Send pickup confirmation email to driver (Phase 3)

        return $this->bookingRepository->findBooking($id);
    }

    public function logReturn(string $id, array $data): ChauffeurBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->returnLog) {
            throw ValidationException::withMessages([
                'return_log' => ['A return log has already been recorded for this booking.'],
            ]);
        }

        $returnedAt = isset($data['returned_at'])
            ? Carbon::parse($data['returned_at'])
            : now();

        [$overtimeHours, $overtimeCharge] = $this->pricingService->calculateOvertime($booking, $returnedAt);
        $overtimeMinutes = (int) ($overtimeHours * 60);

        $booking->returnLog()->create([
            'returned_at' => $returnedAt->toDateTimeString(),
            'odometer_reading' => $data['odometer_reading'] ?? null,
            'condition_notes' => $data['condition_notes'] ?? null,
            'overtime_minutes' => $overtimeMinutes,
            'logged_by' => auth()->id(),
        ]);

        $this->bookingRepository->updateBooking($id, [
            'actual_return_time' => $returnedAt->toDateTimeString(),
        ]);

        $booking->bookingRecords()->create([
            'action' => 'return_logged',
            'performed_by' => auth()->id(),
            'notes' => $overtimeMinutes > 0 ? "Overtime: {$overtimeMinutes} minutes" : null,
        ]);

        return $this->bookingRepository->findBooking($id);
    }

    public function sendPaymentLink(string $id): void
    {
        $booking = $this->bookingRepository->findBooking($id);
        $booking->loadMissing(['chauffeurCustomer']);

        if ($booking->payment_status === ChauffeurPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment' => ['This booking has already been paid.'],
            ]);
        }

        $email = $booking->chauffeurCustomer?->email;
        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        $amountDue = round((float) $booking->total_amount, 2);

        $customer = $booking->chauffeurCustomer;
        $queryParams = http_build_query(array_filter([
            'name' => $customer?->full_name,
            'email' => $customer?->email,
            'phone' => $customer?->phone,
            'booking_ref' => $booking->booking_reference,
        ]));

        $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/chauffeur_booking/' . $booking->id . '?' . $queryParams;

        Mail::to($email)->queue(new BookingPaymentLinkMail(
            customerName: $customer?->full_name ?? 'Customer',
            reference: $booking->booking_reference,
            amountDue: $amountDue,
            paymentUrl: $paymentUrl,
            bookingType: 'Chauffeur Rental',
            currencySymbol: $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ));
    }

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
}
