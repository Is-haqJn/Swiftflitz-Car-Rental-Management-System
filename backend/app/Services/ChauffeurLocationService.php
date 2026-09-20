<?php

namespace App\Services;

use App\DTOs\ChauffeurLocationData;
use App\Models\ChauffeurLocation;
use App\Repositories\Contracts\ChauffeurLocationRepositoryInterface;
use App\Services\Contracts\ChauffeurLocationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ChauffeurLocationService implements ChauffeurLocationServiceInterface
{
    public function __construct(
        protected ChauffeurLocationRepositoryInterface $locationRepository,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->locationRepository->getAll($perPage);
    }

    public function getLocation(string $id): ChauffeurLocation
    {
        return $this->locationRepository->findLocation($id);
    }

    public function create(ChauffeurLocationData $data): ChauffeurLocation
    {
        return $this->locationRepository->createLocation($data->toArray());
    }

    public function update(string $id, array $data): ChauffeurLocation
    {
        return $this->locationRepository->updateLocation($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->locationRepository->deleteLocation($id);
    }
}
