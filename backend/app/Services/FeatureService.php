<?php

namespace App\Services;

use App\DTOs\FeatureData;
use App\Models\Feature;
use App\Repositories\Contracts\FeatureRepositoryInterface;
use App\Services\Contracts\FeatureServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class FeatureService implements FeatureServiceInterface
{
    public function __construct(
        protected FeatureRepositoryInterface $featureRepository
    ) {}

    public function getFeatures(?Request $request = null): Collection|LengthAwarePaginator
    {
        // Delegate to repository which uses spatie query builder
        return $this->featureRepository->getFeatures();
    }

    public function getActiveFeatures()
    {
        return $this->featureRepository->getActive();
    }

    public function getFeature(string $id): Feature
    {
        return $this->featureRepository->findOrFail($id);
    }

    public function createFeature(FeatureData $data): Feature
    {
        return $this->featureRepository->create($data->toArray());
    }

    public function updateFeature(string $id, array $data): Feature
    {
        return $this->featureRepository->update($id, $data);
    }

    public function deleteFeature(string $id): bool
    {
        return $this->featureRepository->delete($id);
    }
}
