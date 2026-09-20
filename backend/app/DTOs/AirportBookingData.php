<?php

namespace App\DTOs;

readonly class AirportBookingData
{
    public function __construct(
        public string $branchId,
        public string $direction,
        public string $packageAssignmentId,
        public string $terminalLocationId,
        public string $areaLocationId,
        public string $scheduledAt,
        public ?string $passengerName,
        public ?string $passengerPhone,
        public int $passengerCount,
        public string $customerFullName,
        public string $customerEmail,
        public string $customerPhone,
        public ?string $specificAddress = null,
        public ?string $flightNumber = null,
        public ?string $airline = null,
        public ?string $paymentMethod = null,
        public ?string $paymentReference = null,
        public ?string $assignmentMode = 'manual',
        public ?string $staffNotes = null,
        public ?string $couponCode = null,
        public string $bookingSource = 'staff',
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            branchId: $data['branch_id'],
            direction: $data['direction'],
            packageAssignmentId: $data['package_assignment_id'],
            terminalLocationId: $data['terminal_location_id'],
            areaLocationId: $data['area_location_id'],
            scheduledAt: $data['scheduled_at'],
            passengerName: $data['passenger_name'] ?? null,
            passengerPhone: $data['passenger_phone'] ?? null,
            passengerCount: (int) $data['passenger_count'],
            customerFullName: $data['customer_full_name'],
            customerEmail: $data['customer_email'],
            customerPhone: $data['customer_phone'],
            specificAddress: $data['specific_address'] ?? null,
            flightNumber: $data['flight_number'] ?? null,
            airline: $data['airline'] ?? null,
            paymentMethod: $data['payment_method'] ?? null,
            paymentReference: $data['payment_reference'] ?? null,
            assignmentMode: $data['assignment_mode'] ?? 'manual',
            staffNotes: $data['staff_notes'] ?? null,
            couponCode: $data['coupon_code'] ?? null,
        );
    }

    public static function fromPublicRequest(array $data, string $branchId): self
    {
        return new self(
            branchId: $branchId,
            direction: $data['direction'],
            packageAssignmentId: $data['package_assignment_id'],
            terminalLocationId: $data['terminal_location_id'],
            areaLocationId: $data['area_location_id'],
            scheduledAt: $data['scheduled_at'],
            passengerName: $data['customer_full_name'],
            passengerPhone: $data['customer_phone'],
            passengerCount: (int) $data['passenger_count'],
            customerFullName: $data['customer_full_name'],
            customerEmail: $data['customer_email'],
            customerPhone: $data['customer_phone'],
            specificAddress: $data['specific_address'] ?? null,
            staffNotes: $data['notes'] ?? null,
            paymentMethod: $data['payment_method'] ?? null,
            paymentReference: $data['payment_reference'] ?? null,
            couponCode: $data['coupon_code'] ?? null,
            bookingSource: 'online',
        );
    }
}
