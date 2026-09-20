<?php

namespace App\DTOs;

readonly class AirportPackageAssignmentData
{
    public function __construct(
        public string $package_id,
        public string $airport_id,
        public float $base_price,
        public bool $is_active,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            package_id: $data['package_id'],
            airport_id: $data['airport_id'],
            base_price: $data['base_price'],
            is_active: $data['is_active'] ?? true,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'package_id' => $this->package_id,
            'airport_id' => $this->airport_id,
            'base_price' => $this->base_price,
            'is_active' => $this->is_active,
        ], fn ($v) => $v !== null);
    }
}
