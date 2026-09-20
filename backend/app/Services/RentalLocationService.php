<?php

namespace App\Services;

use App\DTOs\RentalLocationData;
use App\Models\RentalLocation;
use App\Repositories\Contracts\RentalLocationRepositoryInterface;
use App\Services\Contracts\RentalLocationServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RentalLocationService implements RentalLocationServiceInterface
{
    public function __construct(
        protected RentalLocationRepositoryInterface $repository,
    ) {}

    public function getAll(): mixed
    {
        return $this->repository->getAll();
    }

    public function getActiveForPickup(string $branchId): Collection
    {
        return $this->repository->getActiveForPickup($branchId);
    }

    public function getActiveForDropoff(string $branchId): Collection
    {
        return $this->repository->getActiveForDropoff($branchId);
    }

    public function findLocation(string $id): RentalLocation
    {
        return $this->repository->findLocation($id);
    }

    public function create(RentalLocationData $data): RentalLocation
    {
        return DB::transaction(function () use ($data) {
            $attributes = $data->toArray();

            if (! empty($attributes['is_default'])) {
                $this->repository->unsetBranchDefault($data->branchId);
            }

            return $this->repository->createLocation($attributes);
        });
    }

    public function update(string $id, array $data): RentalLocation
    {
        return DB::transaction(function () use ($id, $data) {
            $location = $this->repository->findLocation($id);

            if (! empty($data['is_default'])) {
                $this->repository->unsetBranchDefault($location->branch_id, $id);
            }

            return $this->repository->updateLocation($id, $data);
        });
    }

    public function delete(string $id): void
    {
        $this->repository->deleteLocation($id);
    }
}
