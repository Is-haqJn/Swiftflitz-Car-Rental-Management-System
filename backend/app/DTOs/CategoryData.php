<?php

namespace App\DTOs;

readonly class CategoryData
{
    public function __construct(
        public string $name,
        public string $description,
        public ?string $icon = null,
        public ?bool $isActive = null,
        public ?float $securityDeposit = null,
        public ?int $youngDriverAgeThreshold = null,
        public ?float $youngDriverDeposit = null,
        public ?float $cancellationFee = null,
        public ?float $beforePickupCancellationFee = null,
        public ?float $afterPickupCancellationFee = null,
        public ?float $overdueFee = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            description: $data['description'],
            icon: $data['icon'] ?? null,
            isActive: $data['is_active'] ?? null,
            securityDeposit: isset($data['security_deposit']) ? (float) $data['security_deposit'] : null,
            youngDriverAgeThreshold: isset($data['young_driver_age_threshold']) ? (int) $data['young_driver_age_threshold'] : null,
            youngDriverDeposit: isset($data['young_driver_deposit']) ? (float) $data['young_driver_deposit'] : null,
            cancellationFee: isset($data['cancellation_fee']) ? (float) $data['cancellation_fee'] : null,
            beforePickupCancellationFee: isset($data['before_pickup_cancellation_fee']) ? (float) $data['before_pickup_cancellation_fee'] : null,
            afterPickupCancellationFee: isset($data['after_pickup_cancellation_fee']) ? (float) $data['after_pickup_cancellation_fee'] : null,
            overdueFee: isset($data['overdue_fee']) ? (float) $data['overdue_fee'] : null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'description' => $this->description,
            'icon' => $this->icon,
            'is_active' => $this->isActive,
            'security_deposit' => $this->securityDeposit,
            'young_driver_age_threshold' => $this->youngDriverAgeThreshold,
            'young_driver_deposit' => $this->youngDriverDeposit,
            'cancellation_fee' => $this->cancellationFee,
            'before_pickup_cancellation_fee' => $this->beforePickupCancellationFee,
            'after_pickup_cancellation_fee' => $this->afterPickupCancellationFee,
            'overdue_fee' => $this->overdueFee,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
