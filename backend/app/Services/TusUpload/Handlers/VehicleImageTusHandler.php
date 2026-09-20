<?php

namespace App\Services\TusUpload\Handlers;

use App\Services\Contracts\VehicleImageServiceInterface;
use App\Services\TusUpload\Traits\HasDefaultUploadSize;
use App\Services\TusUpload\TusUploadHandlerInterface;
use Illuminate\Http\UploadedFile;

class VehicleImageTusHandler implements TusUploadHandlerInterface
{
    use HasDefaultUploadSize;

    public function __construct(
        protected VehicleImageServiceInterface $vehicleImageService
    ) {}

    /**
     * Process a completed vehicle image TUS upload.
     * Immediately attaches the file to the vehicle via Spatie MediaLibrary.
     *
     * Required metadata: entity_id (vehicle UUID)
     * Optional metadata: primary_index (zero-based int)
     */
    public function handle(string $filePath, array $metadata): void
    {
        $vehicleId = $metadata['entity_id'] ?? null;

        if (! $vehicleId) {
            return;
        }

        $primaryIndex = isset($metadata['primary_index']) && $metadata['primary_index'] !== ''
            ? (int) $metadata['primary_index']
            : null;

        $originalName = $metadata['filename'] ?? basename($filePath);
        $mimeType = $metadata['filetype'] ?? mime_content_type($filePath) ?: 'image/jpeg';

        $uploadedFile = new UploadedFile(
            path: $filePath,
            originalName: $originalName,
            mimeType: $mimeType,
            error: UPLOAD_ERR_OK,
            test: true
        );

        $this->vehicleImageService->uploadImages(
            vehicleId: $vehicleId,
            files: [$uploadedFile],
            primaryIndex: $primaryIndex,
        );
    }
}
