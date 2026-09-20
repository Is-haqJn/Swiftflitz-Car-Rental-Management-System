<?php

namespace App\Services\TusUpload\Handlers;

use App\Services\TusUpload\Traits\HasDefaultUploadSize;
use App\Services\TusUpload\TusUploadHandlerInterface;
use App\Settings\GeneralSettings;
use Illuminate\Support\Facades\Storage;

class SiteImageTusHandler implements TusUploadHandlerInterface
{
    use HasDefaultUploadSize;

    /**
     * Process a completed site image TUS upload.
     * Stores the file to the public disk and updates the general settings.
     *
     * No metadata required beyond the standard filename/filetype.
     */
    public function handle(string $filePath, array $metadata): void
    {
        $originalName = $metadata['filename'] ?? basename($filePath);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $newName = 'site/image-' . time() . '.' . $extension;

        Storage::disk('public')->put($newName, file_get_contents($filePath));

        $url = Storage::disk('public')->url($newName);

        $settings = app(GeneralSettings::class);
        $settings->site_image_url = $url;
        $settings->save();
    }
}
