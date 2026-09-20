<?php

namespace App\DTOs\Auth;

readonly class LoginUserData
{
    public function __construct(
        public string $email,
        public string $password,
        public ?bool $rememberMe = false,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
            rememberMe: $data['remember'] ?? false,
        );
    }

    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'password' => $this->password,
            'remember_me' => $this->rememberMe,
        ];
    }

    public function toArrayForUpdate(): array
    {
        return array_filter($this->toArray(), function ($value) {
            return $value !== null;
        });
    }
}
