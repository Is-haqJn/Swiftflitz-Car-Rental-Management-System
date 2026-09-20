<?php

namespace App\Repositories;

use App\Models\AirportPackageAssignment;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportPackageAssignmentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AirportPackageAssignmentRepository extends QueryableRepository implements AirportPackageAssignmentRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $airportIds = $user->branches()
                ->whereNotNull('airport_id')
                ->pluck('airport_id')
                ->toArray();
            $base->whereIn('airport_id', empty($airportIds) ? ['__none__'] : $airportIds);
        }

        return $base;
    }

    public function getAll(): Collection
    {
        return $this->getFiltered();
    }

    public function getByAirport(string $airportId): Collection
    {
        return AirportPackageAssignment::where('airport_id', $airportId)
            ->where('is_active', true)
            ->with(['package', 'airport'])
            ->get();
    }

    public function getAssignment(string $id): AirportPackageAssignment
    {
        return $this->findOrFail($id);
    }

    public function createAssignment(array $data): AirportPackageAssignment
    {
        return $this->create($data);
    }

    public function updateAssignment(string $id, array $data): AirportPackageAssignment
    {
        return $this->update($id, $data);
    }

    public function deleteAssignment(string $id): bool
    {
        return $this->delete($id);
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('airport_id'),
            AllowedFilter::exact('package_id'),
            AllowedFilter::exact('is_active'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['base_price', 'created_at'];
    }

    public function getDefaultIncludes(): array
    {
        return ['package', 'airport'];
    }

    protected function model(): string
    {
        return AirportPackageAssignment::class;
    }
}
