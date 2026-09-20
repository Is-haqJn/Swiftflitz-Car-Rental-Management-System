<?php

namespace App\Repositories;

use App\Models\AirportPackage;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportPackageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AirportPackageRepository extends QueryableRepository implements AirportPackageRepositoryInterface
{
    public function getAll(): Collection
    {
        return $this->getFiltered();
    }

    public function getForPickup(): Collection
    {
        return AirportPackage::where('is_available_for_pickup', true)
            ->where('is_active', true)
            ->get();
    }

    public function getForDropoff(): Collection
    {
        return AirportPackage::where('is_available_for_dropoff', true)
            ->where('is_active', true)
            ->get();
    }

    public function getPackage(string $id): AirportPackage
    {
        return $this->findOrFail($id);
    }

    public function createPackage(array $data): AirportPackage
    {
        return $this->create($data);
    }

    public function updatePackage(string $id, array $data): AirportPackage
    {
        return $this->update($id, $data);
    }

    public function deletePackage(string $id): bool
    {
        return $this->delete($id);
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            AllowedFilter::exact('is_available_for_pickup'),
            AllowedFilter::exact('is_available_for_dropoff'),
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
        return AirportPackage::class;
    }
}
