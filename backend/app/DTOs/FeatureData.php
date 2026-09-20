<?php

namespace App\DTOs;

readonly class FeatureData
{
    public function __construct(
        public string $name,
        public ?string $icon = null,
        public ?bool $isActive = null
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            icon: $data['icon'] ?? null,
            isActive: $data['is_active'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'icon' => $this->icon,
            'is_active' => $this->isActive,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
