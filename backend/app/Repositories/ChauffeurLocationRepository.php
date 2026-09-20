<?php

namespace App\Repositories;

use App\Models\ChauffeurLocation;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\ChauffeurLocationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\QueryBuilder;

class ChauffeurLocationRepository extends QueryableRepository implements ChauffeurLocationRepositoryInterface
{
    public function query(): QueryBuilder
    {
        return parent::query()->defaultSort('name');
    }

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->paginateFiltered($perPage);
    }

    public function findLocation(string $id): ChauffeurLocation
    {
        return ChauffeurLocation::with('branch')->findOrFail($id);
    }

    public function createLocation(array $data): ChauffeurLocation
    {
        return ChauffeurLocation::create($data);
    }

    public function updateLocation(string $id, array $data): ChauffeurLocation
    {
        $location = ChauffeurLocation::findOrFail($id);
        $location->update($data);

        return $location->fresh('branch');
    }

    public function deleteLocation(string $id): bool
    {
        return (bool) ChauffeurLocation::findOrFail($id)->delete();
    }

    public function getAllowedFilters(): array
    {
        return ['branch_id', 'is_active', 'name'];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at'];
    }

    protected function model(): string
    {
        return ChauffeurLocation::class;
    }
}
