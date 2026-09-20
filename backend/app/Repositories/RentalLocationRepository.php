<?php

namespace App\Repositories;

use App\Models\RentalLocation;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\RentalLocationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RentalLocationRepository extends QueryableRepository implements RentalLocationRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        /* Branch-restricted users (those assigned to at least one branch) only see their
           own branches' locations. Global users (no branch assignments) see everything. */
        $user = auth()->user();
        if ($user && $user->branches()->exists()) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereIn('branch_id', $branchIds);
        }

        return $base;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('is_active'),
            AllowedFilter::exact('is_pickup'),
            AllowedFilter::exact('is_dropoff'),
            AllowedFilter::exact('is_default'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where('name', 'like', "%{$value}%");
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at', 'is_default', 'is_active'];
    }

    public function getAllowedIncludes(): array
    {
        return ['branch'];
    }

    public function getDefaultIncludes(): array
    {
        return ['branch'];
    }

    public function getAll(): mixed
    {
        return $this->getFiltered();
    }

    public function getActiveForPickup(string $branchId): Collection
    {
        return $this->query()
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->where('is_pickup', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();
    }

    public function getActiveForDropoff(string $branchId): Collection
    {
        return $this->query()
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->where('is_dropoff', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();
    }

    public function findLocation(string $id): RentalLocation
    {
        return $this->query()->findOrFail($id);
    }

    public function createLocation(array $data): RentalLocation
    {
        return RentalLocation::create($data);
    }

    public function updateLocation(string $id, array $data): RentalLocation
    {
        $location = $this->findLocation($id);
        $location->update($data);

        return $location->fresh('branch');
    }

    public function deleteLocation(string $id): void
    {
        $this->findLocation($id)->delete();
    }

    public function unsetBranchDefault(string $branchId, ?string $excludeId = null): void
    {
        RentalLocation::where('branch_id', $branchId)
            ->where('is_default', true)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->update(['is_default' => false]);
    }

    protected function model(): string
    {
        return RentalLocation::class;
    }
}
