<?php

namespace App\DTOs;

readonly class PaymentVerifyResult
{
    public function __construct(
        public bool $success,
        public string $status,
        public ?float $amount = null,
        public array $meta = [],
        public ?string $channel = null,
        public ?string $paymentPhone = null,
        public ?string $cardBin = null,
        public ?string $cardLast4 = null,
        public ?string $cardType = null,
        public ?float $charges = null,
    ) {}
}
