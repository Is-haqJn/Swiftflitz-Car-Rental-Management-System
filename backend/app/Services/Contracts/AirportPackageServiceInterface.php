<?php

namespace App\Services\Contracts;

use App\DTOs\AirportPackageData;
use App\Models\AirportPackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AirportPackageServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getForPickup(): Collection;

    public function getForDropoff(): Collection;

    public function getPackage(string $id): AirportPackage;

    public function create(AirportPackageData $data): AirportPackage;

    public function update(string $id, array $data): AirportPackage;

    public function delete(string $id): bool;

    public function toggleActive(string $id): AirportPackage;
}
