<?php

namespace App\Repositories;

use App\Models\Airport;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AirportRepository extends QueryableRepository implements AirportRepositoryInterface
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
            $base->whereIn('id', empty($airportIds) ? ['__none__'] : $airportIds);
        }

        return $base;
    }

    public function getAll(): Collection
    {
        return $this->getFiltered();
    }

    public function getActive(): Collection
    {
        return $this->query()->where('is_active', true)->get();
    }

    public function getAirport(string $id): Airport
    {
        return $this->findOrFail($id);
    }

    public function createAirport(array $data): Airport
    {
        return $this->create($data);
    }

    public function updateAirport(string $id, array $data): Airport
    {
        return $this->update($id, $data);
    }

    public function deleteAirport(string $id): bool
    {
        return $this->delete($id);
    }

    public function unsetDefault(?string $excludeId = null): void
    {
        Airport::where('is_default', true)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->update(['is_default' => false]);
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            'city',
            'country',
            AllowedFilter::exact('is_active'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at'];
    }

    public function getDefaultIncludes(): array
    {
        return [];
    }

    protected function model(): string
    {
        return Airport::class;
    }
}
