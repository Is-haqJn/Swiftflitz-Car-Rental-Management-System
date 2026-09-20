<?php

namespace App\DTOs;

readonly class ChauffeurBookingData
{
    public function __construct(
        public string $branchId,
        public string $vehicleId,
        public ?string $driverId,
        public ?string $pickupLocationId,
        public string $pickupTime,
        public ?string $returnTime,
        public string $customerFullName,
        public ?string $customerEmail,
        public string $customerPhone,
        public ?string $expectedDestination,
        public ?string $paymentMethod,
        public ?string $paymentReference,
        public ?string $staffNotes,
        public ?string $couponCode = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            branchId: $data['branch_id'],
            vehicleId: $data['vehicle_id'],
            driverId: $data['driver_id'] ?? null,
            pickupLocationId: $data['pickup_location_id'] ?? null,
            pickupTime: $data['pickup_time'],
            returnTime: $data['return_time'] ?? null,
            customerFullName: $data['customer_full_name'],
            customerEmail: $data['customer_email'] ?? null,
            customerPhone: $data['customer_phone'],
            expectedDestination: $data['expected_destination'] ?? null,
            paymentMethod: $data['payment_method'] ?? null,
            paymentReference: $data['payment_reference'] ?? null,
            staffNotes: $data['staff_notes'] ?? null,
            couponCode: $data['coupon_code'] ?? null,
        );
    }
}
