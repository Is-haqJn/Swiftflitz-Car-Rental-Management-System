<?php

namespace App\Services\TusUpload\Handlers;

use App\Models\User;
use App\Services\TusUpload\Traits\HasDefaultUploadSize;
use App\Services\TusUpload\TusUploadHandlerInterface;
use Illuminate\Support\Facades\Storage;

class ProfilePhotoTusHandler implements TusUploadHandlerInterface
{
    use HasDefaultUploadSize;

    /**
     * Process a completed profile photo TUS upload.
     * Stores the file to the public disk and updates the user record.
     *
     * Required metadata: entity_id (user UUID)
     */
    public function handle(string $filePath, array $metadata): void
    {
        $userId = $metadata['entity_id'] ?? null;

        if (! $userId) {
            return;
        }

        $user = User::find($userId);

        if (! $user) {
            return;
        }

        // ? Delete the previous photo if it exists
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $originalName = $metadata['filename'] ?? basename($filePath);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $newName = 'profile-photos/' . $userId . '-' . time() . '.' . $extension;

        Storage::disk('public')->put($newName, file_get_contents($filePath));

        $user->update(['profile_photo_path' => $newName]);

        activity()
            ->causedBy($user)
            ->performedOn($user)
            ->event('updated')
            ->log('Profile photo updated via TUS.');
    }
}
