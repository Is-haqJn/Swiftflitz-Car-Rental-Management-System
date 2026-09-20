<?php

namespace App\Services\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;

interface ProfileServiceInterface
{
    /**
     * Update the user's profile fields and log the change.
     */
    public function updateProfile(User $user, array $data): User;

    /**
     * Hash and update the user's password, then log the change.
     */
    public function changePassword(User $user, string $password): void;

    /**
     * Get paginated activity log entries for the user.
     */
    public function getActivity(User $user, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all active (non-impersonation) sessions for the user.
     *
     * @return Collection<int, \Laravel\Sanctum\PersonalAccessToken>
     */
    public function getSessions(User $user): Collection;

    /**
     * Revoke a specific session token by ID.
     */
    public function revokeSession(User $user, string $tokenId): void;

    /**
     * Upload and store a new profile photo, removing the old one if present.
     */
    public function uploadPhoto(User $user, UploadedFile $photo): User;

    /**
     * Remove the user's profile photo from storage and database.
     */
    public function removePhoto(User $user): User;
}
