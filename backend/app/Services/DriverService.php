<?php

namespace App\Services;

use App\DTOs\DriverData;
use App\Models\Driver;
use App\Repositories\Contracts\DriverRepositoryInterface;
use App\Services\Contracts\DriverServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class DriverService implements DriverServiceInterface
{
    public function __construct(
        protected DriverRepositoryInterface $driverRepository
    ) {}

    public function getFilteredDrivers(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->driverRepository->query()->defaultSort('-created_at');

        return $query->paginate($perPage)->withPath($this->driverRepository->paginatedPath);
    }

    public function getDriver(string $id): Driver
    {
        return $this->driverRepository->findOrFail($id);
    }

    public function createDriver(DriverData $data): Driver
    {
        $payload = $data->toArray();
        $payload['created_by'] = auth()->id();

        return $this->driverRepository->create($payload);
    }

    public function updateDriver(string $id, DriverData $data): Driver
    {
        return $this->driverRepository->update($id, $data->toArray());
    }

    public function deleteDriver(string $id): bool
    {
        $driver = $this->driverRepository->find($id);

        if ($driver->status->value === 'on_trip') {
            abort(422, 'This driver is currently on a trip and cannot be deleted.');
        }

        return $this->driverRepository->delete($id);
    }

    public function updateStatus(string $id, string $status): Driver
    {
        return $this->driverRepository->update($id, ['status' => $status]);
    }

    public function getAvailableForChauffeur(): Collection
    {
        return $this->driverRepository->getAvailableForChauffeur();
    }

    public function getAvailableForAirport(): Collection
    {
        return $this->driverRepository->getAvailableForAirport();
    }
}
