<?php

namespace App\Http\Controllers\V1\Auth;

use App\DTOs\Auth\LoginUserData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Services\Contracts\AuthServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthServiceInterface $authService
    ) {}

    /**
     * POST /api/v1/auth/login
     * Authenticate user and return a token named after the detected browser and IP.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $browser = $this->detectBrowser($request->userAgent() ?? '');
        $ip = $request->ip() ?? 'Unknown';
        $deviceName = "{$browser} - {$ip}";

        $results = $this->authService->login(LoginUserData::fromRequest($request->validated()), $deviceName);

        $results['user']->load(['roles', 'permissions', 'branches']);

        return $this->authResponse([
            'user' => new UserResource($results['user']),
            'expires_at' => $results['expires_at'],
        ], $results['token'], 'Logged in successfully');
    }

    /**
     * POST /api/v1/auth/logout
     * Logout user (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->noContentResponse();
    }

    /**
     * GET /api/v1/auth/me
     * Return authenticated user info.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->me();
        $user->load(['roles', 'permissions', 'branches']);

        return $this->successResponse(new UserResource($user));
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Send a password reset link to the given email address.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->forgotPassword($request->input('email'));

        return $this->successResponse(null, 'Password reset link sent. Please check your email.');
    }

    /**
     * POST /api/v1/auth/reset-password
     * Reset the user's password using the provided token.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword(
            $request->input('token'),
            $request->input('email'),
            $request->input('password')
        );

        return $this->successResponse(null, 'Password reset successfully.');
    }

    /**
     * Detect the browser name from the User-Agent string.
     */
    private function detectBrowser(string $userAgent): string
    {
        if (str_contains($userAgent, 'Edg/')) {
            return 'Edge';
        }

        if (str_contains($userAgent, 'Chrome')) {
            return 'Chrome';
        }

        if (str_contains($userAgent, 'Firefox')) {
            return 'Firefox';
        }

        if (str_contains($userAgent, 'Safari')) {
            return 'Safari';
        }

        if (str_contains($userAgent, 'Opera') || str_contains($userAgent, 'OPR/')) {
            return 'Opera';
        }

        return 'Browser';
    }
}
