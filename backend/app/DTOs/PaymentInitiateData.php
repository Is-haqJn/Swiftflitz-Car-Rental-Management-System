<?php

namespace App\DTOs;

readonly class PaymentInitiateData
{
    public function __construct(
        public float $amount,
        public string $currency,
        public string $payerEmail,
        public string $payerPhone,
        public string $payerName,
        public string $transactableType,
        public string $transactableId,
        public ?string $callbackUrl = null,
        public ?string $returnUrl = null,
        public array $metadata = [],
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            amount: (float) $data['amount'],
            currency: $data['currency'] ?? 'GHS',
            payerEmail: $data['payer_email'],
            payerPhone: $data['payer_phone'],
            payerName: $data['payer_name'],
            transactableType: $data['transactable_type'],
            transactableId: $data['transactable_id'],
            callbackUrl: $data['callback_url'] ?? null,
            returnUrl: $data['return_url'] ?? null,
            metadata: $data['metadata'] ?? [],
        );
    }
}
