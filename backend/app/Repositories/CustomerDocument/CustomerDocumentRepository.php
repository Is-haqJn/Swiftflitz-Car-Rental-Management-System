<?php

namespace App\Repositories\CustomerDocument;

use App\Models\Customer;
use App\Repositories\Base\QueryableRepository;

class CustomerDocumentRepository extends QueryableRepository implements CustomerDocumentRepositoryInterface
{
    public function getDocuments(string $customerId): array
    {
        $customer = $this->findOrFail($customerId);

        return [
            'license' => $customer->getMedia('license')->toArray(),
            'id_document' => $customer->getMedia('id_document')->toArray(),
            'documents' => $customer->getMedia('documents')->toArray(),
        ];
    }

    public function uploadLicense(string $customerId, array $files): array
    {
        $customer = $this->findOrFail($customerId);
        $customer->clearMediaCollection('license');

        foreach ($files as $file) {
            $customer->addMedia($file)->toMediaCollection('license');
        }

        return $customer->getMedia('license')->toArray();
    }

    public function uploadIdDocument(string $customerId, array $files): array
    {
        $customer = $this->findOrFail($customerId);
        $customer->clearMediaCollection('id_document');

        foreach ($files as $file) {
            $customer->addMedia($file)->toMediaCollection('id_document');
        }

        return $customer->getMedia('id_document')->toArray();
    }

    public function uploadPassport(string $customerId, array $files): array
    {
        $customer = $this->findOrFail($customerId);
        $customer->clearMediaCollection('passport');

        foreach ($files as $file) {
            $customer->addMedia($file)->toMediaCollection('passport');
        }

        return $customer->getMedia('passport')->toArray();
    }

    public function uploadDocument(string $customerId, array $files): array
    {
        $customer = $this->findOrFail($customerId);

        foreach ($files as $file) {
            $customer->addMedia($file)->toMediaCollection('documents');
        }

        return $customer->getMedia('documents')->toArray();
    }

    public function deleteDocument(string $customerId, int $mediaId): bool
    {
        $customer = $this->findOrFail($customerId);
        $media = $customer->media()->findOrFail($mediaId);
        $media->delete();

        return true;
    }

    protected function model(): string
    {
        return Customer::class;
    }
}
