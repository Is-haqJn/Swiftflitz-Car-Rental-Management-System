<?php

namespace App\Services\Contracts;

use App\DTOs\DriverData;
use App\Models\Driver;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

interface DriverServiceInterface
{
    public function getFilteredDrivers(?Request $request, int $perPage = 15): LengthAwarePaginator;

    public function getDriver(string $id): Driver;

    public function createDriver(DriverData $data): Driver;

    public function updateDriver(string $id, DriverData $data): Driver;

    public function deleteDriver(string $id): bool;

    public function updateStatus(string $id, string $status): Driver;

    /**
     * @return Collection<int, Driver>
     */
    public function getAvailableForChauffeur(): Collection;

    /**
     * @return Collection<int, Driver>
     */
    public function getAvailableForAirport(): Collection;
}
