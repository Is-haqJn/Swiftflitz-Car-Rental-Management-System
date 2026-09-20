<?php

namespace App\Repositories;

use App\Enums\FleetVehicleStatus;
use App\Models\FleetVehicle;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\FleetVehicleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class FleetVehicleRepository extends QueryableRepository implements FleetVehicleRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereIn('branch_id', empty($branchIds) ? ['__none__'] : $branchIds);
        }

        return $base;
    }

    public function getAll(): LengthAwarePaginator
    {
        return $this->paginateFiltered();
    }

    public function getVehicle(string $id): FleetVehicle
    {
        return $this->query()
            ->with(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media'])
            ->findOrFail($id);
    }

    public function createVehicle(array $data): FleetVehicle
    {
        return $this->create($data);
    }

    public function updateVehicle(string $id, array $data): FleetVehicle
    {
        return $this->update($id, $data);
    }

    public function deleteVehicle(string $id): bool
    {
        return $this->delete($id);
    }

    public function getAvailableForAirport(): Collection
    {
        return $this->query()
            ->where('status', FleetVehicleStatus::Available->value)
            ->where('is_active', true)
            ->with(['branch', 'media'])
            ->get();
    }

    public function getAvailableForChauffeur(bool $featuredOnly = false): Collection
    {
        return $this->query()
            ->where('status', FleetVehicleStatus::Available->value)
            ->where('is_active', true)
            ->whereHas('chauffeurAssignment', fn ($q) => $q->where('is_active', true))
            ->when($featuredOnly, fn ($q) => $q->where('is_featured', true))
            ->with(['branch', 'media', 'serviceAssignments'])
            ->get();
    }

    public function getAllowedFilters(): array
    {
        return [
            'make',
            'model',
            'license_plate',
            AllowedFilter::exact('status'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('is_active'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['make', 'model', 'year', 'license_plate', 'created_at'];
    }

    public function getDefaultIncludes(): array
    {
        return ['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media'];
    }

    protected function model(): string
    {
        return FleetVehicle::class;
    }
}
