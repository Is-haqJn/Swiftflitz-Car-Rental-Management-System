<?php

namespace App\Repositories\Contracts;

use App\Models\AirportLocation;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AirportLocationRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(): Collection;

    public function getTerminalsByAirport(string $airportId): Collection;

    public function getAreasByBranch(string $branchId): Collection;

    public function getLocation(string $id): AirportLocation;

    public function createLocation(array $data): AirportLocation;

    public function updateLocation(string $id, array $data): AirportLocation;

    public function deleteLocation(string $id): bool;
}
