<?php

namespace App\Services\Contracts;

use App\DTOs\AirportLocationData;
use App\Models\AirportLocation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AirportLocationServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getTerminalsByAirport(string $airportId): Collection;

    public function getAreasByBranch(string $branchId): Collection;

    public function getLocation(string $id): AirportLocation;

    public function create(AirportLocationData $data): AirportLocation;

    public function update(string $id, array $data): AirportLocation;

    public function delete(string $id): bool;

    public function toggleActive(string $id): AirportLocation;
}
