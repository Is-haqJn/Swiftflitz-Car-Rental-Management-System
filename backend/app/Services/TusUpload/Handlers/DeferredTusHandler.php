<?php

namespace App\Services\TusUpload\Handlers;

use App\Services\TusUpload\Traits\HasDefaultUploadSize;
use App\Services\TusUpload\TusUploadHandlerInterface;
use Illuminate\Support\Facades\Cache;

class DeferredTusHandler implements TusUploadHandlerInterface
{
    use HasDefaultUploadSize;

    /** @const int Hours to keep deferred files in cache and on disk */
    public const TTL_HOURS = 2;

    /**
     * Store a deferred TUS upload for later form submission.
     * The upload key is cached so form endpoints can resolve it to an UploadedFile.
     *
     * The file remains at $filePath (inside the TUS upload directory).
     * The cache entry maps the TUS token to the file details.
     */
    public function handle(string $filePath, array $metadata): void
    {
        $token = $metadata['tus_key'] ?? null;

        if (! $token || ! file_exists($filePath)) {
            return;
        }

        Cache::put("tus_deferred:{$token}", [
            'path' => $filePath,
            'filename' => $metadata['filename'] ?? basename($filePath),
            'mime_type' => $metadata['filetype'] ?? mime_content_type($filePath) ?: 'application/octet-stream',
            'entity_type' => $metadata['entity_type'] ?? null,
        ], now()->addHours(self::TTL_HOURS));
    }
}
