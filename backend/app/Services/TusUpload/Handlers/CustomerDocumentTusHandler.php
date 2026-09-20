<?php

namespace App\Services\TusUpload\Handlers;

use App\Services\Contracts\CustomerDocumentServiceInterface;
use App\Services\TusUpload\Traits\HasDefaultUploadSize;
use App\Services\TusUpload\TusUploadHandlerInterface;
use Illuminate\Http\UploadedFile;

class CustomerDocumentTusHandler implements TusUploadHandlerInterface
{
    use HasDefaultUploadSize;

    public function __construct(
        protected CustomerDocumentServiceInterface $customerDocumentService
    ) {}

    /**
     * Process a completed customer document TUS upload.
     * Immediately attaches the file to the customer via Spatie MediaLibrary.
     *
     * Required metadata: entity_id (customer UUID), collection (license|id_document|documents)
     */
    public function handle(string $filePath, array $metadata): void
    {
        $customerId = $metadata['entity_id'] ?? null;
        $collection = $metadata['collection'] ?? 'documents';

        if (! $customerId) {
            return;
        }

        $originalName = $metadata['filename'] ?? basename($filePath);
        $mimeType = $metadata['filetype'] ?? mime_content_type($filePath) ?: 'image/jpeg';

        $uploadedFile = new UploadedFile(
            path: $filePath,
            originalName: $originalName,
            mimeType: $mimeType,
            error: UPLOAD_ERR_OK,
            test: true
        );

        match ($collection) {
            'license' => $this->customerDocumentService->uploadLicense($customerId, [$uploadedFile]),
            'id_document' => $this->customerDocumentService->uploadIdDocument($customerId, [$uploadedFile]),
            default => $this->customerDocumentService->uploadDocument($customerId, [$uploadedFile]),
        };
    }
}
