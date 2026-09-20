<?php

namespace App\Services;

use App\Models\User;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Models\Activity;

class ProfileService implements ProfileServiceInterface
{
    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);

        activity()
            ->causedBy($user)
            ->performedOn($user)
            ->event('updated')
            ->log('Profile updated.');

        return $user->fresh(['roles', 'permissions']);
    }

    public function changePassword(User $user, string $password): void
    {
        $user->update(['password' => Hash::make($password)]);

        activity()
            ->causedBy($user)
            ->performedOn($user)
            ->event('updated')
            ->log('Password changed.');
    }

    public function getActivity(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Activity::query()
            ->where('causer_id', $user->id)
            ->latest()
            ->paginate($perPage);
    }

    public function getSessions(User $user): Collection
    {
        return $user->tokens()
            ->where('name', '!=', 'impersonation_token')
            ->get(['id', 'name', 'created_at', 'last_used_at', 'expires_at']);
    }

    public function revokeSession(User $user, string $tokenId): void
    {
        $user->tokens()->where('id', $tokenId)->delete();
    }

    public function uploadPhoto(User $user, UploadedFile $photo): User
    {
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $path = $photo->store('profile-photos', 'public');

        $user->update(['profile_photo_path' => $path]);

        activity()
            ->causedBy($user)
            ->performedOn($user)
            ->event('updated')
            ->log('Profile photo updated.');

        return $user->fresh(['roles', 'permissions']);
    }

    public function removePhoto(User $user): User
    {
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->update(['profile_photo_path' => null]);
        }

        activity()
            ->causedBy($user)
            ->performedOn($user)
            ->event('updated')
            ->log('Profile photo removed.');

        return $user->fresh(['roles', 'permissions']);
    }
}
