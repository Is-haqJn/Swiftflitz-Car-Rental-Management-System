<?php

namespace App\Services\Contracts;

use App\DTOs\AdditionalChargeData;
use App\Models\AdditionalCharge;
use Illuminate\Database\Eloquent\Collection;

interface AdditionalChargeServiceInterface
{
    public function getAll(): mixed;

    public function findCharge(string $id): AdditionalCharge;

    public function create(AdditionalChargeData $data): AdditionalCharge;

    public function update(string $id, array $data): AdditionalCharge;

    public function delete(string $id): void;

    public function getGlobalCharges(): Collection;

    public function getCategoryCharges(string $categoryId): Collection;

    public function getVehicleCharges(string $vehicleId): Collection;

    public function getRegularCharges(?string $branchId = null): Collection;
}
