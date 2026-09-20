<?php

namespace App\Services\Contracts;

interface CustomerDocumentServiceInterface
{
    public function getDocuments(string $customerId): array;

    public function uploadLicense(string $customerId, array $files): array;

    public function uploadIdDocument(string $customerId, array $files): array;

    public function uploadPassport(string $customerId, array $files): array;

    public function uploadDocument(string $customerId, array $files): array;

    public function deleteDocument(string $customerId, int $mediaId): bool;
}
