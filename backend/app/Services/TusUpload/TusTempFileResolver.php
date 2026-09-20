<?php

namespace App\Services\TusUpload;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;

class TusTempFileResolver
{
    /**
     * Resolve a TUS upload token to an UploadedFile instance.
     * Returns null if the token is expired or the file no longer exists.
     */
    public function resolve(string $token): ?UploadedFile
    {
        $cached = Cache::get("tus_deferred:{$token}");

        if (! $cached || ! file_exists($cached['path'])) {
            return null;
        }

        return new UploadedFile(
            path: $cached['path'],
            originalName: $cached['filename'],
            mimeType: $cached['mime_type'],
            error: UPLOAD_ERR_OK,
            test: true
        );
    }

    /**
     * Resolve multiple TUS tokens to UploadedFile instances.
     * Silently skips expired or missing tokens.
     *
     * @param  string[]  $tokens
     * @return UploadedFile[]
     */
    public function resolveMany(array $tokens): array
    {
        return array_values(
            array_filter(
                array_map(fn (string $token) => $this->resolve($token), $tokens)
            )
        );
    }
}
