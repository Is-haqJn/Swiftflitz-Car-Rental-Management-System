<?php

namespace App\Repositories;

use App\Enums\AirportLocationType;
use App\Models\AirportLocation;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportLocationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AirportLocationRepository extends QueryableRepository implements AirportLocationRepositoryInterface
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

            $branchIds = $user->branches()->pluck('id')->toArray();

            $base->where(function ($q) use ($airportIds, $branchIds) {
                // Terminals: scoped to the user's airports
                $q->whereIn('airport_id', empty($airportIds) ? ['__none__'] : $airportIds)
                    // Areas: scoped to the user's branches
                    ->orWhereIn('branch_id', empty($branchIds) ? ['__none__'] : $branchIds);
            });
        }

        return $base;
    }

    public function getAll(): Collection
    {
        return $this->getFiltered();
    }

    public function getTerminalsByAirport(string $airportId): Collection
    {
        return AirportLocation::where('location_type', AirportLocationType::Terminal)
            ->where('airport_id', $airportId)
            ->where('is_active', true)
            ->get();
    }

    public function getAreasByBranch(string $branchId): Collection
    {
        return AirportLocation::where('location_type', AirportLocationType::Area)
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->get();
    }

    public function getLocation(string $id): AirportLocation
    {
        return $this->findOrFail($id);
    }

    public function createLocation(array $data): AirportLocation
    {
        return $this->create($data);
    }

    public function updateLocation(string $id, array $data): AirportLocation
    {
        return $this->update($id, $data);
    }

    public function deleteLocation(string $id): bool
    {
        return $this->delete($id);
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            AllowedFilter::exact('location_type'),
            AllowedFilter::exact('airport_id'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('is_active'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at'];
    }

    public function getDefaultIncludes(): array
    {
        return ['airport', 'branch'];
    }

    protected function model(): string
    {
        return AirportLocation::class;
    }
}
