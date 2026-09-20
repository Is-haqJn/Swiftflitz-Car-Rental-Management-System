<?php

namespace App\Services;

use App\Repositories\CustomerDocument\CustomerDocumentRepositoryInterface;
use App\Services\Contracts\CustomerDocumentServiceInterface;

class CustomerDocumentService implements CustomerDocumentServiceInterface
{
    public function __construct(protected CustomerDocumentRepositoryInterface $repository) {}

    public function getDocuments(string $customerId): array
    {
        $docs = $this->repository->getDocuments($customerId);

        // Map media arrays to API-friendly structures
        return array_map(function ($collection) {
            return array_map(fn ($m) => $this->formatMediaFromArray($m), $collection);
        }, $docs);
    }

    public function uploadLicense(string $customerId, array $files): array
    {
        $docs = $this->repository->uploadLicense($customerId, $files);

        return array_map(fn ($m) => $this->formatMediaFromArray($m), $docs);
    }

    public function uploadIdDocument(string $customerId, array $files): array
    {
        $docs = $this->repository->uploadIdDocument($customerId, $files);

        return array_map(fn ($m) => $this->formatMediaFromArray($m), $docs);
    }

    public function uploadPassport(string $customerId, array $files): array
    {
        $docs = $this->repository->uploadPassport($customerId, $files);

        return array_map(fn ($m) => $this->formatMediaFromArray($m), $docs);
    }

    public function uploadDocument(string $customerId, array $files): array
    {
        $docs = $this->repository->uploadDocument($customerId, $files);

        return array_map(fn ($m) => $this->formatMediaFromArray($m), $docs);
    }

    public function deleteDocument(string $customerId, int $mediaId): bool
    {
        return $this->repository->deleteDocument($customerId, $mediaId);
    }

    private function formatMedia($media): array
    {
        $isImage = str_starts_with($media->mime_type, 'image/');

        return [
            'id' => $media->id,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'collection_name' => $media->collection_name,
            'urls' => [
                'original' => $media->getUrl(),
                'thumb' => $isImage ? $media->getUrl('thumb') : null,
                'medium' => $isImage ? $media->getUrl('medium') : null,
                'large' => $isImage ? $media->getUrl('large') : null,
            ],
            'created_at' => $media->created_at?->toISOString(),
        ];
    }

    private function formatMediaFromArray(array $m): array
    {
        $isImage = str_starts_with($m['mime_type'] ?? '', 'image/');

        return [
            'id' => $m['id'] ?? null,
            'file_name' => $m['file_name'] ?? null,
            'mime_type' => $m['mime_type'] ?? null,
            'size' => $m['size'] ?? null,
            'collection_name' => $m['collection_name'] ?? null,
            'urls' => [
                'original' => $m['url'] ?? ($m['generated_conversions']['original'] ?? null),
                'thumb' => $isImage ? ($m['conversions']['thumb']['url'] ?? null) : null,
                'medium' => $isImage ? ($m['conversions']['medium']['url'] ?? null) : null,
                'large' => $isImage ? ($m['conversions']['large']['url'] ?? null) : null,
            ],
            'created_at' => isset($m['created_at']) ? (is_string($m['created_at']) ? $m['created_at'] : null) : null,
        ];
    }
}
