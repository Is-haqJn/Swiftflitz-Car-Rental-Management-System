<?php

namespace App\DTOs;

readonly class VehicleExpenseData
{
    public function __construct(
        public string $vehicleId,
        public string $type,
        public float $amount,
        public ?string $recordedBy = null,
        public ?string $description = null,
        public ?string $expenseDate = null,
        public ?string $currency = null,
        public ?string $currencySymbol = null,
        public ?float $exchangeRate = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            vehicleId: $data['vehicle_id'],
            type: $data['type'],
            amount: (float) ($data['amount'] ?? 0.0),
            recordedBy: $data['recorded_by'] ?? null,
            description: $data['description'] ?? null,
            expenseDate: $data['expense_date'] ?? null,
            currency: $data['currency'] ?? null,
            currencySymbol: $data['currency_symbol'] ?? null,
            exchangeRate: isset($data['exchange_rate']) ? (float) $data['exchange_rate'] : null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'vehicle_id' => $this->vehicleId,
            'expense_type' => $this->type,
            'amount' => $this->amount,
            'recorded_by' => $this->recordedBy,
            'description' => $this->description,
            'expense_date' => $this->expenseDate,
            'currency' => $this->currency,
            'currency_symbol' => $this->currencySymbol,
            'exchange_rate' => $this->exchangeRate,
        ], fn ($v) => $v !== null);
    }
}
