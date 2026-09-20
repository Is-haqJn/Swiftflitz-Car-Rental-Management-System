<?php

namespace App\DTOs;

readonly class PaymentResult
{
    public function __construct(
        public bool $success,
        public string $reference,
        public ?string $authorizationUrl = null,
        public array $meta = [],
        public ?string $providerReference = null,
    ) {}
}
