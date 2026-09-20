<?php

namespace App\DTOs;

readonly class AirportCustomerData
{
    public function __construct(
        public string $fullName,
        public string $email,
        public string $phone,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            fullName: $data['full_name'],
            email: $data['email'],
            phone: $data['phone'],
        );
    }

    public function toArray(): array
    {
        return [
            'full_name' => $this->fullName,
            'email' => $this->email,
            'phone' => $this->phone,
        ];
    }
}
