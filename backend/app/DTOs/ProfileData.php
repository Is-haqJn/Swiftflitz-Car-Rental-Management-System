<?php

namespace App\DTOs;

readonly class ProfileData
{
    public function __construct(
        public ?string $name = null,
        public ?string $username = null,
        public ?string $phone = null,
        public ?string $currentPassword = null,
        public ?string $newPassword = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'] ?? null,
            username: $data['username'] ?? null,
            phone: $data['phone'] ?? null,
            currentPassword: $data['current_password'] ?? null,
            newPassword: $data['password'] ?? null,
        );
    }
}
