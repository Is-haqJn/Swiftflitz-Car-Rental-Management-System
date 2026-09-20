<?php

namespace App\Services\Contracts;

use App\DTOs\RentalLocationData;
use App\Models\RentalLocation;
use Illuminate\Database\Eloquent\Collection;

interface RentalLocationServiceInterface
{
    public function getAll(): mixed;

    public function getActiveForPickup(string $branchId): Collection;

    public function getActiveForDropoff(string $branchId): Collection;

    public function findLocation(string $id): RentalLocation;

    public function create(RentalLocationData $data): RentalLocation;

    public function update(string $id, array $data): RentalLocation;

    public function delete(string $id): void;
}
