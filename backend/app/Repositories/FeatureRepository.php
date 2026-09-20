<?php

namespace App\Repositories;

use App\Models\Feature;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\FeatureRepositoryInterface;

class FeatureRepository extends QueryableRepository implements FeatureRepositoryInterface
{
    public function getFeatures(int $perPage = 15)
    {
        return $this->query()->paginate($perPage);
    }

    public function getActive()
    {
        return $this->query()->where('is_active', true)->orderBy('name')->get();
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'name',
            'created_at',
        ];
    }

    protected function model(): string
    {
        return Feature::class;
    }
}
