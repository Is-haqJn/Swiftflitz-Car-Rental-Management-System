<?php

namespace App\DTOs;

readonly class DiscountRuleData
{
    public function __construct(
        public string $name,
        public string $discountType,
        public float $discountValue,
        public string $conditionType,
        public ?string $branchId = null,
        public ?string $description = null,
        public ?string $conditionValue = null,
        public ?bool $isStackable = null,
        public ?bool $isActive = null,
        public ?string $validFrom = null,
        public ?string $validTo = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            discountType: $data['discount_type'],
            discountValue: (float) $data['discount_value'],
            conditionType: $data['condition_type'],
            branchId: $data['branch_id'] ?? null,
            description: $data['description'] ?? null,
            conditionValue: $data['condition_value'] ?? null,
            isStackable: $data['is_stackable'] ?? null,
            isActive: $data['is_active'] ?? null,
            validFrom: $data['valid_from'] ?? null,
            validTo: $data['valid_to'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'branch_id' => $this->branchId,
            'name' => $this->name,
            'description' => $this->description,
            'discount_type' => $this->discountType,
            'discount_value' => $this->discountValue,
            'condition_type' => $this->conditionType,
            'condition_value' => $this->conditionValue,
            'is_stackable' => $this->isStackable,
            'is_active' => $this->isActive,
            'valid_from' => $this->validFrom,
            'valid_to' => $this->validTo,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
