<?php

namespace App\Services;

use App\DTOs\AdditionalChargeData;
use App\Models\AdditionalCharge;
use App\Repositories\Contracts\AdditionalChargeRepositoryInterface;
use App\Services\Contracts\AdditionalChargeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AdditionalChargeService implements AdditionalChargeServiceInterface
{
    public function __construct(
        protected AdditionalChargeRepositoryInterface $repository,
    ) {}

    public function getAll(): mixed
    {
        return $this->repository->getAll();
    }

    public function findCharge(string $id): AdditionalCharge
    {
        return $this->repository->findCharge($id);
    }

    public function create(AdditionalChargeData $data): AdditionalCharge
    {
        return DB::transaction(function () use ($data) {
            return $this->repository->createCharge($data->toArray());
        });
    }

    public function update(string $id, array $data): AdditionalCharge
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->repository->updateCharge($id, $data);
        });
    }

    public function delete(string $id): void
    {
        $this->repository->deleteCharge($id);
    }

    public function getGlobalCharges(): Collection
    {
        return $this->repository->getGlobalCharges();
    }

    public function getCategoryCharges(string $categoryId): Collection
    {
        return $this->repository->getCategoryCharges($categoryId);
    }

    public function getVehicleCharges(string $vehicleId): Collection
    {
        return $this->repository->getVehicleCharges($vehicleId);
    }

    public function getRegularCharges(?string $branchId = null): Collection
    {
        return $this->repository->getRegularCharges($branchId);
    }
}
