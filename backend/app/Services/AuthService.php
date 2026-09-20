<?php

namespace App\Services;

use App\DTOs\Auth\LoginUserData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

readonly class AuthService implements AuthServiceInterface
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
    ) {}

    public function login(LoginUserData $data, string $deviceName = 'Browser'): array
    {
        // ? check email against both email and username column for both username and email login
        if (! Auth::attempt(['email' => $data->email, 'password' => $data->password], $data->rememberMe) &&
            ! Auth::attempt(['username' => $data->email, 'password' => $data->password], $data->rememberMe)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        // ? TODO: implement 2FA if enabled in config

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive. Please contact support.'],
            ]);
        }

        $this->userRepository->update($user->id, ['last_login_at' => now()]);

        // ? Revoke old tokens if single session is enabled
        if (config('swiftflitz.auth.single_session')) {
            $user->tokens()?->delete();
        }

        $expiresAt = $data->rememberMe
            ? now()->addDays((int) config('swiftflitz.auth.token_expiration_days'))
            : now()->addHour();

        $token = $user->createToken($deviceName, expiresAt: $expiresAt)->plainTextToken;

        return [
            'user' => $user->load(['roles', 'permissions']),
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    public function logout(User $user): bool
    {
        $token = $user->currentAccessToken();

        if (! ($token instanceof PersonalAccessToken)) {
            return true;
        }

        if (config('swiftflitz.auth.single_session')) {
            $user->tokens()?->delete();
        } else {
            $token->delete();
        }

        return true;
    }

    public function me(): Authenticatable
    {
        return Auth::user()->load(['roles', 'permissions']); // eager load roles and permissions
    }

    public function forgotPassword(string $email): ?bool
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status === Password::RESET_LINK_SENT) {
            return true;
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    public function resetPassword(string $token, string $email, string $password): ?bool
    {
        $status = Password::reset([
            'token' => $token,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ], function ($user, $password) {
            $user->password = Hash::make($password);
            $user->save();
            $user->tokens()->delete();
        });

        if ($status === Password::PASSWORD_RESET) {
            return true;
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
