<?php

namespace App\DTOs;

readonly class QuoteRequestData
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $phone = null,
        public ?string $vehicleId = null,
        public ?string $customerId = null,
        public ?string $branchId = null,
        public ?string $pickupLocationId = null,
        public ?int $rentalDays = null,
        public ?string $expectedPickupDate = null,
        public ?string $pickupDate = null,
        public ?string $returnDate = null,
        public ?string $vehiclePreference = null,
        public ?string $message = null,
        public ?string $adminNotes = null,
        /** @var string[]|null */
        public ?array $requestedAddonIds = null,
        public ?string $dateOfBirth = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            phone: $data['phone'] ?? null,
            vehicleId: $data['vehicle_id'] ?? null,
            customerId: $data['customer_id'] ?? null,
            branchId: $data['branch_id'] ?? null,
            pickupLocationId: $data['pickup_location_id'] ?? null,
            rentalDays: isset($data['rental_days']) ? (int) $data['rental_days'] : null,
            expectedPickupDate: $data['expected_pickup_date'] ?? null,
            pickupDate: $data['pickup_date'] ?? null,
            returnDate: $data['return_date'] ?? null,
            vehiclePreference: $data['vehicle_preference'] ?? null,
            message: $data['message'] ?? null,
            adminNotes: $data['admin_notes'] ?? null,
            requestedAddonIds: $data['requested_addon_ids'] ?? null,
            dateOfBirth: $data['date_of_birth'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'vehicle_id' => $this->vehicleId,
            'customer_id' => $this->customerId,
            'branch_id' => $this->branchId,
            'pickup_location_id' => $this->pickupLocationId,
            'rental_days' => $this->rentalDays,
            'expected_pickup_date' => $this->expectedPickupDate,
            'pickup_date' => $this->pickupDate,
            'return_date' => $this->returnDate,
            'vehicle_preference' => $this->vehiclePreference,
            'message' => $this->message,
            'admin_notes' => $this->adminNotes,
            'requested_addon_ids' => $this->requestedAddonIds,
        ], fn ($v) => ! is_null($v));
    }
}
