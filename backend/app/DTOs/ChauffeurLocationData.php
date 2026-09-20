<?php

namespace App\DTOs;

readonly class ChauffeurLocationData
{
    public function __construct(
        public string $branchId,
        public string $name,
        public ?float $charge,
        public bool $isActive,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            branchId: $data['branch_id'],
            name: $data['name'],
            charge: isset($data['charge']) ? (float) $data['charge'] : null,
            isActive: $data['is_active'] ?? true,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'branch_id' => $this->branchId,
            'name' => $this->name,
            'charge' => $this->charge,
            'is_active' => $this->isActive,
        ], fn ($value) => $value !== null);
    }
}
