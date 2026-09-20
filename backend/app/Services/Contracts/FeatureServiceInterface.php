<?php

namespace App\Services\Contracts;

use App\DTOs\FeatureData;
use App\Models\Feature;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface FeatureServiceInterface
{
    public function getFeatures(?Request $request = null): Collection|LengthAwarePaginator;

    public function getActiveFeatures();

    public function getFeature(string $id): Feature;

    public function createFeature(FeatureData $data): Feature;

    public function updateFeature(string $id, array $data): Feature;

    public function deleteFeature(string $id): bool;
}
