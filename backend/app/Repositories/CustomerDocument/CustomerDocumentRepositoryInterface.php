<?php

namespace App\Repositories\CustomerDocument;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;

interface CustomerDocumentRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Retrieve all media grouped by collection for a customer.
     */
    public function getDocuments(string $customerId): array;

    public function uploadLicense(string $customerId, array $files): array;

    public function uploadIdDocument(string $customerId, array $files): array;

    public function uploadPassport(string $customerId, array $files): array;

    public function uploadDocument(string $customerId, array $files): array;

    public function deleteDocument(string $customerId, int $mediaId): bool;
}
