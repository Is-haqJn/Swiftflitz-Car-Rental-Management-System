<?php

namespace App\Services\Contracts;

use App\DTOs\Auth\LoginUserData;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

interface AuthServiceInterface
{
    public function login(LoginUserData $data, string $deviceName = 'Browser'): array;

    public function logout(User $user): bool;

    public function me(): Authenticatable;

    public function forgotPassword(string $email): ?bool;

    public function resetPassword(string $token, string $email, string $password): ?bool;
}
