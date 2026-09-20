<?php

namespace App\Services\TusUpload;

interface TusUploadHandlerInterface
{
    /**
     * Process a completed TUS upload.
     *
     * @param  string  $filePath  Absolute path to the uploaded file on disk
     * @param  array<string, string>  $metadata  Decoded metadata sent by the client
     */
    public function handle(string $filePath, array $metadata): void;

    /**
     * Maximum allowed upload size in bytes for this entity type.
     * Defaults to the standard limit via the HasDefaultUploadSize trait.
     */
    public function maxUploadSize(): int;
}
