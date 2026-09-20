<?php

namespace App\Repositories\Contracts;

use App\Models\RentalLocation;
use Illuminate\Database\Eloquent\Collection;

interface RentalLocationRepositoryInterface
{
    public function getAll(): mixed;

    public function getActiveForPickup(string $branchId): Collection;

    public function getActiveForDropoff(string $branchId): Collection;

    public function findLocation(string $id): RentalLocation;

    public function createLocation(array $data): RentalLocation;

    public function updateLocation(string $id, array $data): RentalLocation;

    public function deleteLocation(string $id): void;

    public function unsetBranchDefault(string $branchId, ?string $excludeId = null): void;
}
