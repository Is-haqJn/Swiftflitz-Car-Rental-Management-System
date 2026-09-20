<?php

namespace App\Services\TusUpload\Traits;

trait HasDefaultUploadSize
{
    public function maxUploadSize(): int
    {
        return (int) config('swiftflitz.uploads.max_size', 20 * 1024 * 1024);
    }
}
