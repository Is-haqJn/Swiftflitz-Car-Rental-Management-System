<?php

namespace App\DTOs;

readonly class AirportPackageData
{
    public function __construct(
        public string $name,
        public array $features,
        public bool $is_available_for_pickup,
        public bool $is_available_for_dropoff,
        public bool $auto_assign_vehicle,
        public bool $is_active,
        public ?string $description,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            features: $data['features'],
            is_available_for_pickup: $data['is_available_for_pickup'] ?? true,
            is_available_for_dropoff: $data['is_available_for_dropoff'] ?? true,
            auto_assign_vehicle: $data['auto_assign_vehicle'] ?? true,
            is_active: $data['is_active'] ?? true,
            description: $data['description'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'features' => $this->features,
            'is_available_for_pickup' => $this->is_available_for_pickup,
            'is_available_for_dropoff' => $this->is_available_for_dropoff,
            'auto_assign_vehicle' => $this->auto_assign_vehicle,
            'is_active' => $this->is_active,
            'description' => $this->description,
        ], fn ($v) => $v !== null);
    }
}
