<?php

namespace App\DTOs;

readonly class AirportData
{
    public function __construct(
        public string $name,
        public string $city,
        public string $country,
        public bool $is_active,
        public ?array $branch_ids = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            city: $data['city'],
            country: $data['country'],
            is_active: $data['is_active'] ?? true,
            branch_ids: $data['branch_ids'] ?? null,
        );
    }

    public function toArray(): array
    {
        // branch_ids is not an airport column - exclude it
        return array_filter([
            'name' => $this->name,
            'city' => $this->city,
            'country' => $this->country,
            'is_active' => $this->is_active,
        ], fn ($v) => $v !== null);
    }
}
