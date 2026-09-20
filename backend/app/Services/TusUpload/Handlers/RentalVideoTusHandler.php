<?php

namespace App\Services\TusUpload\Handlers;

use App\Services\TusUpload\TusUploadHandlerInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RentalVideoTusHandler implements TusUploadHandlerInterface
{
    /** Default maximum video file size in bytes (2 GB). */
    public const MAX_BYTES = 2 * 1024 * 1024 * 1024;

    /** Hours to keep deferred files in cache and on disk. */
    public const TTL_HOURS = 2;

    public function maxUploadSize(): int
    {
        return (int) config('swiftflitz.uploads.video_max_size', self::MAX_BYTES);
    }

    public function handle(string $filePath, array $metadata): void
    {
        $token = $metadata['tus_key'] ?? null;

        if (! $token || ! file_exists($filePath)) {
            return;
        }

        $size = filesize($filePath);
        $maxBytes = $this->maxUploadSize();

        if ($size === false || $size > $maxBytes) {
            Log::warning('RentalVideoTusHandler: file exceeds max size, discarding', [
                'token' => $token,
                'size' => $size,
                'max' => $maxBytes,
            ]);
            @unlink($filePath);

            return;
        }

        Cache::put("tus_deferred:{$token}", [
            'path' => $filePath,
            'filename' => $metadata['filename'] ?? basename($filePath),
            'mime_type' => $metadata['filetype'] ?? mime_content_type($filePath) ?: 'video/mp4',
            'entity_type' => $metadata['entity_type'] ?? null,
        ], now()->addHours(self::TTL_HOURS));
    }
}
