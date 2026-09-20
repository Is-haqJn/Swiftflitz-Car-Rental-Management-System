<?php

namespace App\Services;

use App\DTOs\AirportLocationData;
use App\Models\AirportLocation;
use App\Repositories\Contracts\AirportLocationRepositoryInterface;
use App\Services\Contracts\AirportLocationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AirportLocationService implements AirportLocationServiceInterface
{
    public function __construct(
        protected AirportLocationRepositoryInterface $locationRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->locationRepository->paginateFiltered();
    }

    public function getTerminalsByAirport(string $airportId): Collection
    {
        return $this->locationRepository->getTerminalsByAirport($airportId);
    }

    public function getAreasByBranch(string $branchId): Collection
    {
        return $this->locationRepository->getAreasByBranch($branchId);
    }

    public function getLocation(string $id): AirportLocation
    {
        return $this->locationRepository->getLocation($id);
    }

    public function create(AirportLocationData $data): AirportLocation
    {
        return $this->locationRepository->createLocation($data->toArray());
    }

    public function update(string $id, array $data): AirportLocation
    {
        return $this->locationRepository->updateLocation($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->locationRepository->deleteLocation($id);
    }

    public function toggleActive(string $id): AirportLocation
    {
        $location = $this->locationRepository->findOrFail($id);
        $location->is_active = ! $location->is_active;
        $location->save();

        return $location->fresh();
    }
}
