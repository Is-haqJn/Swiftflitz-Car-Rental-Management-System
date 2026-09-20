<?php

namespace App\DTOs;

readonly class AdditionalChargeData
{
    public function __construct(
        public string $name,
        public string $scope,
        public string $chargeType,
        public float $amount,
        public ?string $branchId = null,
        public ?string $description = null,
        public ?string $categoryId = null,
        public ?string $vehicleId = null,
        public ?int $stockQuantity = null,
        public ?bool $isWaivable = null,
        public ?bool $isActive = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            scope: $data['scope'],
            chargeType: $data['charge_type'],
            amount: (float) $data['amount'],
            branchId: $data['branch_id'] ?? null,
            description: $data['description'] ?? null,
            categoryId: $data['category_id'] ?? null,
            vehicleId: $data['vehicle_id'] ?? null,
            stockQuantity: isset($data['stock_quantity']) ? (int) $data['stock_quantity'] : null,
            isWaivable: $data['is_waivable'] ?? null,
            isActive: $data['is_active'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'branch_id' => $this->branchId,
            'name' => $this->name,
            'description' => $this->description,
            'scope' => $this->scope,
            'category_id' => $this->categoryId,
            'vehicle_id' => $this->vehicleId,
            'charge_type' => $this->chargeType,
            'amount' => $this->amount,
            'stock_quantity' => $this->stockQuantity,
            'is_waivable' => $this->isWaivable,
            'is_active' => $this->isActive,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
