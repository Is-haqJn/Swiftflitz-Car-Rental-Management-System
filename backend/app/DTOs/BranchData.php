<?php

namespace App\DTOs;

readonly class BranchData
{
    public function __construct(
        public string $name,
        public ?string $code,
        public ?string $address,
        public ?string $description,
        public bool $is_active,
        public ?string $currency,
        public ?string $currency_symbol,
        public ?float $exchange_rate,
        public bool $show_converted_price,
        public ?bool $has_airport_service,
        public ?string $airport_id,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            code: $data['code'] ?? null,
            address: $data['address'] ?? null,
            description: $data['description'] ?? null,
            is_active: $data['is_active'] ?? true,
            currency: $data['currency'] ?? null,
            currency_symbol: $data['currency_symbol'] ?? null,
            exchange_rate: isset($data['exchange_rate']) ? (float) $data['exchange_rate'] : null,
            show_converted_price: $data['show_converted_price'] ?? true,
            has_airport_service: $data['has_airport_service'] ?? null,
            airport_id: $data['airport_id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'currency' => $this->currency,
            'currency_symbol' => $this->currency_symbol,
            'exchange_rate' => $this->exchange_rate,
            'show_converted_price' => $this->show_converted_price,
            'has_airport_service' => $this->has_airport_service,
            'airport_id' => $this->airport_id,
        ], fn ($v) => $v !== null);
    }
}
