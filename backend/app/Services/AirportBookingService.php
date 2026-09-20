<?php

namespace App\Services;

use App\DTOs\AirportBookingData;
use App\Enums\AirportBookingStatus;
use App\Enums\AirportPaymentStatus;
use App\Enums\ChauffeurBookingStatus;
use App\Enums\CouponScopeType;
use App\Enums\FleetVehicleStatus;
use App\Enums\TransactionType;
use App\Events\AirportBookingCancelled;
use App\Events\AirportBookingCreated;
use App\Events\AirportBookingStatusChanged;
use App\Jobs\SendAirportBookingDocumentJob;
use App\Mail\AirportDriverAssignmentMail;
use App\Mail\BookingPaymentLinkMail;
use App\Models\AirportBooking;
use App\Models\AirportLocation;
use App\Models\AirportPackageAssignment;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\DiscountCoupon;
use App\Models\Driver;
use App\Models\FleetVehicle;
use App\Models\PaymentTransaction;
use App\Repositories\Contracts\AirportBookingRepositoryInterface;
use App\Services\Contracts\AirportBookingServiceInterface;
use App\Services\Contracts\AirportCustomerServiceInterface;
use App\Services\Contracts\AirportPricingServiceInterface;
use App\Services\Contracts\DriverAvailabilityServiceInterface;
use App\Settings\AirportCancellationSettings;
use App\Settings\GeneralSettings;
use App\Support\CurrencyHelper;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AirportBookingService implements AirportBookingServiceInterface
{
    public function __construct(
        protected AirportBookingRepositoryInterface $bookingRepository,
        protected AirportCustomerServiceInterface $customerService,
        protected AirportPricingServiceInterface $pricingService,
        protected AirportCancellationSettings $cancellationSettings,
        protected DriverAvailabilityServiceInterface $driverAvailability,
        protected GeneralSettings $generalSettings,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->bookingRepository->getAll($perPage);
    }

    public function getBooking(string $id): AirportBooking
    {
        return $this->bookingRepository->findBooking($id);
    }

    public function create(AirportBookingData $data): AirportBooking
    {
        $booking = DB::transaction(function () use ($data) {
            $assignment = AirportPackageAssignment::with(['package', 'airport'])
                ->findOrFail($data->packageAssignmentId);

            $areaLocation = AirportLocation::findOrFail($data->areaLocationId);

            $coupon = $data->couponCode
                ? DiscountCoupon::where('code', $data->couponCode)->with('scopes')->first()
                : null;

            if ($coupon && ! $coupon->appliesToAny([
                [CouponScopeType::Airport, null],
                [CouponScopeType::AirportPackage, (string) $assignment->package_id],
            ])) {
                $coupon = null;
            }

            $pricing = $this->pricingService->calculate($assignment, $areaLocation, $coupon);

            $customer = $this->customerService->findOrCreateFromBookingData($data);

            $isInStorePayment = $data->paymentMethod !== null && $data->paymentMethod !== 'website';
            $paymentStatus = $isInStorePayment ? AirportPaymentStatus::Paid : AirportPaymentStatus::Pending;
            $bookingStatus = $isInStorePayment ? AirportBookingStatus::PaymentReceived : AirportBookingStatus::Pending;

            if ($pricing->total <= 0) {
                $paymentStatus = AirportPaymentStatus::Paid;
                $bookingStatus = AirportBookingStatus::PaymentReceived;
            }

            // Auto-assign default driver from the package assignment vehicle (if any)
            $autoDriverId = null;
            $assignmentMode = $data->assignmentMode ?? 'manual';

            $bookingVehicleId = $assignment->vehicle_id ?? null;

            if ($bookingVehicleId !== null) {
                $vehicle = FleetVehicle::find($bookingVehicleId);

                if ($vehicle && $vehicle->default_driver_id !== null) {
                    $scheduledCarbon = Carbon::parse($data->scheduledAt);

                    if (! $this->driverAvailability->hasConflict($vehicle->default_driver_id, $scheduledCarbon, $scheduledCarbon)) {
                        $autoDriverId = $vehicle->default_driver_id;
                        $assignmentMode = 'auto';
                        if ($bookingStatus === AirportBookingStatus::Pending) {
                            $bookingStatus = AirportBookingStatus::DriverAssigned;
                        }
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
                    'airport_id' => $assignment->airport_id,
                    'direction' => $data->direction,
                    'package_id' => $assignment->package_id,
                    'package_assignment_id' => $data->packageAssignmentId,
                    'vehicle_id' => $bookingVehicleId,
                    'driver_id' => $autoDriverId,
                    'airport_customer_id' => $customer->id,
                    'passenger_name' => $data->passengerName,
                    'passenger_phone' => $data->passengerPhone,
                    'passenger_count' => $data->passengerCount,
                    'flight_number' => $data->flightNumber,
                    'airline' => $data->airline,
                    'scheduled_at' => $data->scheduledAt,
                    'terminal_location_id' => $data->terminalLocationId,
                    'area_location_id' => $data->areaLocationId,
                    'specific_address' => $data->specificAddress,
                    'payment_status' => $paymentStatus->value,
                    'payment_method' => $data->paymentMethod,
                    'payment_reference' => $data->paymentReference,
                    'booking_status' => $bookingStatus->value,
                    'booking_source' => $data->bookingSource,
                    'assignment_mode' => $assignmentMode,
                    'staff_notes' => $data->staffNotes,
                    'created_by' => auth()->id(),
                    'currency' => $currencySnapshot['code'],
                    'currency_symbol' => $currencySnapshot['symbol'],
                    'exchange_rate' => $currencySnapshot['is_custom'] ? $currencySnapshot['rate'] : null,
                ],
                $pricing->toSnapshot(),
            ));

            $freshBooking = $this->bookingRepository->findBooking($newBooking->id);

            if ($isInStorePayment) {
                $this->createInitialPaymentTransaction($freshBooking, $data);
            }

            return $freshBooking;
        });

        $variant = $data->paymentMethod !== null ? 'receipt' : 'invoice';
        SendAirportBookingDocumentJob::dispatch($booking, $variant);

        AirportBookingCreated::dispatch($booking);

        return $booking;
    }

    public function update(string $id, array $data): AirportBooking
    {
        return $this->bookingRepository->updateBooking($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->bookingRepository->deleteBooking($id);
    }

    public function confirmBooking(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->payment_status !== AirportPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'booking_status' => ['Payment must be received before confirming this booking.'],
            ]);
        }

        if ($booking->booking_status !== AirportBookingStatus::PaymentReceived) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only bookings with payment received can be confirmed.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => AirportBookingStatus::Confirmed->value,
        ]);

        AirportBookingStatusChanged::dispatch($updated, AirportBookingStatus::PaymentReceived->value);

        return $updated;
    }

    public function assignDriver(string $id, array $data): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $assignableStatuses = [AirportBookingStatus::Confirmed, AirportBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $assignableStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only confirmed or driver-assigned bookings can have a driver or vehicle assigned.'],
            ]);
        }

        $oldStatus = $booking->booking_status->value;

        $update = [
            'assignment_mode' => $data['assignment_mode'] ?? 'manual',
            'booking_status' => AirportBookingStatus::DriverAssigned->value,
        ];

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

            $scheduledCarbon = Carbon::parse($booking->scheduled_at);

            if ($this->driverAvailability->hasConflict($driver->id, $scheduledCarbon, $scheduledCarbon, $booking->id)) {
                throw ValidationException::withMessages([
                    'driver_id' => ['The selected driver has a conflicting booking at this time.'],
                ]);
            }

            $update['driver_id'] = $driver->id;
        }

        $updated = $this->bookingRepository->updateBooking($id, $update);

        $fresh = $updated->load(['airportCustomer', 'vehicle', 'driver', 'airport', 'terminalLocation', 'areaLocation']);

        if ($fresh->driver?->email) {
            Mail::to($fresh->driver->email)
                ->queue(new AirportDriverAssignmentMail($fresh));
        }

        AirportBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated;
    }

    public function removeDriver(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== AirportBookingStatus::DriverAssigned) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only driver-assigned bookings can have the driver removed.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'driver_id' => null,
            'vehicle_id' => null,
            'booking_status' => AirportBookingStatus::Confirmed->value,
        ]);

        AirportBookingStatusChanged::dispatch($updated, AirportBookingStatus::DriverAssigned->value);

        return $updated;
    }

    public function startTrip(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $allowedStatuses = [AirportBookingStatus::Confirmed, AirportBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $allowedStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['The trip cannot be started from its current status.'],
            ]);
        }

        if (! $booking->driver_id || ! $booking->vehicle_id) {
            throw ValidationException::withMessages([
                'assignment' => ['A driver and vehicle must be assigned before starting the trip.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => AirportBookingStatus::InProgress->value,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'trip_started',
            'performed_by' => auth()->id(),
        ]);

        AirportBookingStatusChanged::dispatch($updated, AirportBookingStatus::DriverAssigned->value);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function completeTrip(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== AirportBookingStatus::InProgress) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only in-progress trips can be marked as completed.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => AirportBookingStatus::Completed->value,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'trip_completed',
            'performed_by' => auth()->id(),
        ]);

        AirportBookingStatusChanged::dispatch($updated, AirportBookingStatus::InProgress->value);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function cancelBooking(string $id, array $data): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $cancellableStatuses = [
            AirportBookingStatus::Pending,
            AirportBookingStatus::PaymentReceived,
            AirportBookingStatus::Confirmed,
        ];

        if (! in_array($booking->booking_status, $cancellableStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['This booking cannot be cancelled from its current status.'],
            ]);
        }

        $cancellationFee = $this->resolveCancellationFee($booking);

        $paymentStatus = $booking->payment_status;
        if ($cancellationFee === 0.0 && $booking->payment_status === AirportPaymentStatus::Paid) {
            $paymentStatus = AirportPaymentStatus::Refunded;
        }

        $oldStatus = $booking->booking_status->value;

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => AirportBookingStatus::Cancelled->value,
            'payment_status' => $paymentStatus->value,
            'cancellation_fee_applied' => $cancellationFee,
            'cancelled_at' => now(),
            'cancelled_by' => auth()->id(),
        ]);

        AirportBookingCancelled::dispatch($updated);
        AirportBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated;
    }

    public function markNoShow(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        $allowedStatuses = [AirportBookingStatus::Confirmed, AirportBookingStatus::DriverAssigned];

        if (! in_array($booking->booking_status, $allowedStatuses)) {
            throw ValidationException::withMessages([
                'booking_status' => ['No-show can only be recorded for confirmed or driver-assigned bookings.'],
            ]);
        }

        $oldStatus = $booking->booking_status->value;

        $updated = $this->bookingRepository->updateBooking($id, [
            'booking_status' => AirportBookingStatus::NoShow->value,
        ]);

        AirportBookingCancelled::dispatch($updated);
        AirportBookingStatusChanged::dispatch($updated, $oldStatus);

        return $updated;
    }

    public function recordPayment(string $id, array $data): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->payment_status !== AirportPaymentStatus::Pending) {
            throw ValidationException::withMessages([
                'payment_status' => ['Payment has already been recorded for this booking.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'payment_method' => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'payment_status' => AirportPaymentStatus::Paid->value,
            'booking_status' => AirportBookingStatus::PaymentReceived->value,
        ]);

        PaymentTransaction::create([
            'reference' => 'MAN-' . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => $this->resolvePaymentChannel($data['payment_method'] ?? null),
            'payment_phone' => $data['payment_phone'] ?? null,
            'type' => TransactionType::ManualPayment->value,
            'amount' => (float) $updated->total_amount,
            'currency' => $updated->currency ?? 'GHS',
            'currency_symbol' => $updated->currency_symbol ?? null,
            'exchange_rate' => $updated->exchange_rate ?? null,
            'status' => 'paid',
            'paid_at' => now(),
            'description' => $data['payment_reference'] ?? null,
            'payer_name' => $updated->passenger_name ?? 'Unknown',
            'payer_email' => $updated->airportCustomer?->email ?? '',
            'payer_phone' => $updated->passenger_phone ?? '',
            'transactable_type' => 'airport_booking',
            'transactable_id' => $updated->id,
            'branch_id' => $updated->branch_id,
            'processed_by_user_id' => auth()->id(),
        ]);

        SendAirportBookingDocumentJob::dispatch($updated, 'receipt');

        return $updated;
    }

    public function markRefunded(string $id): AirportBooking
    {
        $booking = $this->bookingRepository->findBooking($id);

        if ($booking->booking_status !== AirportBookingStatus::Cancelled) {
            throw ValidationException::withMessages([
                'booking_status' => ['Only cancelled bookings can be marked as refunded.'],
            ]);
        }

        if ($booking->payment_status !== AirportPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment_status' => ['Only bookings with a paid status can be refunded.'],
            ]);
        }

        $updated = $this->bookingRepository->updateBooking($id, [
            'payment_status' => AirportPaymentStatus::Refunded->value,
        ]);

        $updated->bookingRecords()->create([
            'action' => 'refunded',
            'performed_by' => auth()->id(),
        ]);

        return $updated->fresh(['bookingRecords.performedBy']);
    }

    public function blockedDates(string $branchId, Carbon $from, Carbon $to): array
    {
        $fleetCount = FleetVehicle::where('branch_id', $branchId)
            ->where('is_active', true)
            ->count();

        if ($fleetCount === 0) {
            return [];
        }

        $activeAirportStatuses = [
            AirportBookingStatus::Pending,
            AirportBookingStatus::PaymentReceived,
            AirportBookingStatus::Confirmed,
            AirportBookingStatus::DriverAssigned,
            AirportBookingStatus::InProgress,
        ];

        $activeChauffeurStatuses = [
            ChauffeurBookingStatus::Pending,
            ChauffeurBookingStatus::Confirmed,
            ChauffeurBookingStatus::DriverAssigned,
            ChauffeurBookingStatus::InProgress,
        ];

        // Airport: point-in-time bookings → index by date
        $airportByDate = AirportBooking::where('branch_id', $branchId)
            ->whereIn('booking_status', $activeAirportStatuses)
            ->whereNotNull('vehicle_id')
            ->whereDate('scheduled_at', '>=', $from)
            ->whereDate('scheduled_at', '<=', $to)
            ->selectRaw('DATE(scheduled_at) as booking_date, vehicle_id')
            ->get()
            ->groupBy('booking_date')
            ->map(fn ($rows) => $rows->pluck('vehicle_id')->unique()->values()->all());

        // Chauffeur: range bookings → expand each booking to all dates it spans
        $chauffeurByDate = [];

        ChauffeurBooking::where('branch_id', $branchId)
            ->whereIn('booking_status', $activeChauffeurStatuses)
            ->whereNotNull('vehicle_id')
            ->where('pickup_time', '<=', $to->copy()->endOfDay())
            ->where('return_time', '>=', $from->copy()->startOfDay())
            ->select('vehicle_id', 'pickup_time', 'return_time')
            ->get()
            ->each(function ($booking) use ($from, $to, &$chauffeurByDate) {
                $start = Carbon::parse($booking->pickup_time)->max($from)->startOfDay();
                $end = Carbon::parse($booking->return_time)->min($to)->startOfDay();

                for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
                    $chauffeurByDate[$day->toDateString()][] = $booking->vehicle_id;
                }
            });

        // Walk the date range and flag days where all vehicles are occupied
        $blocked = [];
        $cursor = $from->copy()->startOfDay();

        while ($cursor->lte($to)) {
            $key = $cursor->toDateString();

            $airportVehicles = $airportByDate->get($key, []);
            $chauffeurVehicles = $chauffeurByDate[$key] ?? [];

            $occupiedCount = count(array_unique(array_merge($airportVehicles, $chauffeurVehicles)));

            if ($occupiedCount >= $fleetCount) {
                $blocked[] = $key;
            }

            $cursor->addDay();
        }

        return $blocked;
    }

    public function sendPaymentLink(string $id): void
    {
        $booking = $this->bookingRepository->findBooking($id);
        $booking->loadMissing(['airportCustomer']);

        if ($booking->payment_status === AirportPaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment' => ['This booking has already been paid.'],
            ]);
        }

        $email = $booking->airportCustomer?->email;
        if (! $email) {
            throw ValidationException::withMessages([
                'customer' => ['Customer has no email address on file.'],
            ]);
        }

        $amountDue = round((float) $booking->total_amount, 2);

        $customer = $booking->airportCustomer;
        $queryParams = http_build_query(array_filter([
            'name' => $booking->passenger_name ?? $customer?->full_name,
            'email' => $customer?->email,
            'phone' => $booking->passenger_phone ?? $customer?->phone,
            'booking_ref' => $booking->booking_reference,
        ]));

        $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/airport_booking/' . $booking->id . '?' . $queryParams;

        Mail::to($email)->queue(new BookingPaymentLinkMail(
            customerName: $booking->passenger_name ?? $customer?->full_name ?? 'Customer',
            reference: $booking->booking_reference,
            amountDue: $amountDue,
            paymentUrl: $paymentUrl,
            bookingType: 'Airport Transfer',
            currencySymbol: $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ));
    }

    private function createInitialPaymentTransaction(AirportBooking $booking, AirportBookingData $data): void
    {
        PaymentTransaction::create([
            'reference' => 'MAN-' . strtoupper(Str::random(10)),
            'provider' => 'manual',
            'channel' => $this->resolvePaymentChannel($data->paymentMethod),
            'type' => TransactionType::FullPayment->value,
            'amount' => (float) $booking->total_amount,
            'currency' => $booking->currency ?? 'GHS',
            'currency_symbol' => $booking->currency_symbol ?? null,
            'exchange_rate' => $booking->exchange_rate ?? null,
            'status' => 'paid',
            'paid_at' => now(),
            'description' => $data->paymentReference ?? null,
            'payer_name' => $booking->passenger_name ?? $booking->airportCustomer?->full_name ?? 'Unknown',
            'payer_email' => $booking->airportCustomer?->email ?? '',
            'payer_phone' => $booking->passenger_phone ?? $booking->airportCustomer?->phone ?? '',
            'transactable_type' => 'airport_booking',
            'transactable_id' => $booking->id,
            'branch_id' => $booking->branch_id,
            'processed_by_user_id' => auth()->id(),
        ]);
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

    private function resolveCancellationFee(AirportBooking $booking): float
    {
        $freeUntil = $booking->scheduled_at->subHours($this->cancellationSettings->free_cancellation_hours);

        if (now()->lessThan($freeUntil)) {
            return 0.00;
        }

        $total = (float) $booking->total_amount;

        return match ($this->cancellationSettings->cancellation_fee_type) {
            'flat' => min((float) $this->cancellationSettings->cancellation_fee_amount, $total),
            'percentage' => round($total * (float) $this->cancellationSettings->cancellation_fee_amount / 100, 2),
            default => 0.00,
        };
    }
}
