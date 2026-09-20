<?php

namespace App\DTOs;

readonly class DiscountCouponData
{
    /**
     * @param  array<array{scope_type: string, scope_id: string|null}>  $scopes
     */
    public function __construct(
        public string $name,
        public string $type,
        public float $value,
        public ?string $code = null,
        public ?string $couponType = null,
        public ?string $description = null,
        public ?int $validDays = null,
        public ?int $maxUses = null,
        public ?int $maxUsesPerCustomer = null,
        public ?int $minRentalDays = null,
        public ?float $minRentalAmount = null,
        public ?bool $isActive = null,
        public array $scopes = [],
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            type: $data['type'],
            value: (float) $data['value'],
            code: $data['code'] ?? null,
            couponType: $data['coupon_type'] ?? null,
            description: $data['description'] ?? null,
            validDays: isset($data['valid_days']) ? (int) $data['valid_days'] : null,
            maxUses: isset($data['max_uses']) ? (int) $data['max_uses'] : null,
            maxUsesPerCustomer: isset($data['max_uses_per_customer']) ? (int) $data['max_uses_per_customer'] : null,
            minRentalDays: isset($data['min_rental_days']) ? (int) $data['min_rental_days'] : null,
            minRentalAmount: isset($data['min_rental_amount']) ? (float) $data['min_rental_amount'] : null,
            isActive: $data['is_active'] ?? null,
            scopes: $data['scopes'] ?? [],
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'type' => $this->type,
            'value' => $this->value,
            'code' => $this->code,
            'coupon_type' => $this->couponType,
            'description' => $this->description,
            'valid_days' => $this->validDays,
            'max_uses' => $this->maxUses,
            'max_uses_per_customer' => $this->maxUsesPerCustomer,
            'min_rental_days' => $this->minRentalDays,
            'min_rental_amount' => $this->minRentalAmount,
            'is_active' => $this->isActive,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
