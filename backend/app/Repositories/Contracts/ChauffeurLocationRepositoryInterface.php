<?php

namespace App\Repositories\Contracts;

use App\Models\ChauffeurLocation;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChauffeurLocationRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findLocation(string $id): ChauffeurLocation;

    public function createLocation(array $data): ChauffeurLocation;

    public function updateLocation(string $id, array $data): ChauffeurLocation;

    public function deleteLocation(string $id): bool;
}
