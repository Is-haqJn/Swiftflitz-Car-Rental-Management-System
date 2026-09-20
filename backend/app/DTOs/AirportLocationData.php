<?php

namespace App\DTOs;

readonly class AirportLocationData
{
    public function __construct(
        public string $location_type,
        public string $name,
        public bool $has_charge,
        public bool $is_active,
        public ?string $airport_id,
        public ?string $branch_id,
        public ?float $charge_amount,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            location_type: $data['location_type'],
            name: $data['name'],
            has_charge: $data['has_charge'] ?? false,
            is_active: $data['is_active'] ?? true,
            airport_id: $data['airport_id'] ?? null,
            branch_id: $data['branch_id'] ?? null,
            charge_amount: $data['charge_amount'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'location_type' => $this->location_type,
            'name' => $this->name,
            'has_charge' => $this->has_charge,
            'is_active' => $this->is_active,
            'airport_id' => $this->airport_id,
            'branch_id' => $this->branch_id,
            'charge_amount' => $this->charge_amount,
        ], fn ($v) => $v !== null);
    }
}
