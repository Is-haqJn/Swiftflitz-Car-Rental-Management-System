<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendTestNotificationRequest;
use App\Services\Contracts\TestNotificationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class TestNotificationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected TestNotificationServiceInterface $testNotificationService,
    ) {}

    /**
     * POST /api/v1/notifications/test-email
     * Send a test email notification of a given type to the provided email address.
     */
    public function send(SendTestNotificationRequest $request): JsonResponse
    {
        $type = $request->validated('type');
        $email = $request->validated('email');

        try {
            $this->testNotificationService->sendTestEmail($type, $email);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(null, "Test '{$type}' email sent successfully to {$email}.");
    }
}
