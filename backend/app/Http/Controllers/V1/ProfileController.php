<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UploadProfilePhotoRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\UserResource;
use App\Services\Contracts\ProfileServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProfileServiceInterface $profileService
    ) {}

    /**
     * GET /api/profile
     * Get the authenticated user's profile with roles and permissions.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'permissions']);

        return $this->successResponse(new UserResource($user));
    }

    /**
     * PATCH /api/profile
     * Update the authenticated user's own profile (name, username, phone).
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profileService->updateProfile($request->user(), $request->validated());

        return $this->successResponse(new UserResource($user), 'Profile updated successfully.');
    }

    /**
     * PATCH /api/profile/password
     * Change the authenticated user's password.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->profileService->changePassword($request->user(), $request->validated('password'));

        return $this->successResponse(null, 'Password changed successfully.');
    }

    /**
     * GET /api/profile/activity
     * Get the authenticated user's own activity logs.
     */
    public function activity(Request $request): JsonResponse
    {
        $logs = $this->profileService->getActivity($request->user(), $request->integer('per_page', 15));

        return $this->successResponse(ActivityLogResource::collection($logs));
    }

    /**
     * GET /api/profile/sessions
     * Get all active tokens (sessions) for the authenticated user.
     */
    public function sessions(Request $request): JsonResponse
    {
        $tokens = $this->profileService->getSessions($request->user());

        return $this->successResponse($tokens);
    }

    /**
     * DELETE /api/profile/sessions/{tokenId}
     * Revoke a specific session token.
     */
    public function revokeSession(Request $request, string $tokenId): JsonResponse
    {
        $this->profileService->revokeSession($request->user(), $tokenId);

        return $this->noContentResponse();
    }

    /**
     * POST /api/profile/photo
     * Upload a new profile picture for the authenticated user.
     */
    public function uploadPhoto(UploadProfilePhotoRequest $request): JsonResponse
    {
        $user = $this->profileService->uploadPhoto($request->user(), $request->file('photo'));

        return $this->successResponse(new UserResource($user), 'Profile photo updated successfully.');
    }

    /**
     * DELETE /api/profile/photo
     * Remove the authenticated user's profile photo.
     */
    public function removePhoto(Request $request): JsonResponse
    {
        $user = $this->profileService->removePhoto($request->user());

        return $this->successResponse(new UserResource($user), 'Profile photo removed.');
    }
}
