<?php

namespace App\DTOs;

readonly class ChauffeurCustomerData
{
    public function __construct(
        public string $fullName,
        public ?string $email,
        public string $phone,
        public ?string $expectedDestination,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            fullName: $data['full_name'],
            email: $data['email'] ?? null,
            phone: $data['phone'],
            expectedDestination: $data['expected_destination'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'full_name' => $this->fullName,
            'email' => $this->email,
            'phone' => $this->phone,
            'expected_destination' => $this->expectedDestination,
        ], fn ($value) => $value !== null);
    }
}
