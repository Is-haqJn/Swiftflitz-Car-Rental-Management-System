<?php

namespace App\DTOs;

readonly class UserData
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $username = null,
        public ?string $password = null,
        public ?string $phone = null,
        public ?bool $isActive = true,
        /** @var array<string>|null */
        public ?array $roles = null,
        /** @var array<string>|null */
        public ?array $permissions = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            username: $data['username'] ?? null,
            password: $data['password'] ?? null,
            phone: $data['phone'] ?? null,
            isActive: $data['is_active'] ?? true,
            roles: $data['roles'] ?? null,
            permissions: $data['permissions'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'password' => $this->password,
            'phone' => $this->phone,
            'is_active' => $this->isActive,
        ], fn ($value) => $value !== null);
    }
}
