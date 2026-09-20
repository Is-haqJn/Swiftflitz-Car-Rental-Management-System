<?php

namespace App\Services;

use App\DTOs\AirportPackageData;
use App\Models\AirportPackage;
use App\Repositories\Contracts\AirportPackageRepositoryInterface;
use App\Services\Contracts\AirportPackageServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AirportPackageService implements AirportPackageServiceInterface
{
    public function __construct(
        protected AirportPackageRepositoryInterface $packageRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->packageRepository->paginateFiltered();
    }

    public function getForPickup(): Collection
    {
        return $this->packageRepository->getForPickup();
    }

    public function getForDropoff(): Collection
    {
        return $this->packageRepository->getForDropoff();
    }

    public function getPackage(string $id): AirportPackage
    {
        return $this->packageRepository->getPackage($id);
    }

    public function create(AirportPackageData $data): AirportPackage
    {
        return $this->packageRepository->createPackage($data->toArray());
    }

    public function update(string $id, array $data): AirportPackage
    {
        return $this->packageRepository->updatePackage($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->packageRepository->deletePackage($id);
    }

    public function toggleActive(string $id): AirportPackage
    {
        $package = $this->packageRepository->findOrFail($id);
        $package->is_active = ! $package->is_active;
        $package->save();

        return $package->fresh();
    }
}
