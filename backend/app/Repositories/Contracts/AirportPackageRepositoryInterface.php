<?php

namespace App\Repositories\Contracts;

use App\Models\AirportPackage;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AirportPackageRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(): Collection;

    public function getForPickup(): Collection;

    public function getForDropoff(): Collection;

    public function getPackage(string $id): AirportPackage;

    public function createPackage(array $data): AirportPackage;

    public function updatePackage(string $id, array $data): AirportPackage;

    public function deletePackage(string $id): bool;
}
