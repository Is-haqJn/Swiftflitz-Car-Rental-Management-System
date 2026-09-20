<?php

namespace App\DTOs;

readonly class RentalLocationData
{
    public function __construct(
        public string $branchId,
        public string $name,
        public ?float $pickupCharge = null,
        public ?float $dropoffCharge = null,
        public ?bool $isDefault = null,
        public ?bool $isPickup = null,
        public ?bool $isDropoff = null,
        public ?bool $isActive = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            branchId: $data['branch_id'],
            name: $data['name'],
            pickupCharge: isset($data['pickup_charge']) ? (float) $data['pickup_charge'] : null,
            dropoffCharge: isset($data['dropoff_charge']) ? (float) $data['dropoff_charge'] : null,
            isDefault: $data['is_default'] ?? null,
            isPickup: $data['is_pickup'] ?? null,
            isDropoff: $data['is_dropoff'] ?? null,
            isActive: $data['is_active'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'branch_id' => $this->branchId,
            'name' => $this->name,
            'pickup_charge' => $this->pickupCharge,
            'dropoff_charge' => $this->dropoffCharge,
            'is_default' => $this->isDefault,
            'is_pickup' => $this->isPickup,
            'is_dropoff' => $this->isDropoff,
            'is_active' => $this->isActive,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
