<?php

namespace App\Repositories\Contracts;

use App\Models\AdditionalCharge;
use Illuminate\Database\Eloquent\Collection;

interface AdditionalChargeRepositoryInterface
{
    public function getAll(): mixed;

    public function findCharge(string $id): AdditionalCharge;

    public function createCharge(array $data): AdditionalCharge;

    public function updateCharge(string $id, array $data): AdditionalCharge;

    public function deleteCharge(string $id): void;

    public function getGlobalCharges(): Collection;

    public function getCategoryCharges(string $categoryId): Collection;

    public function getVehicleCharges(string $vehicleId): Collection;

    public function getRegularCharges(?string $branchId = null): Collection;
}
