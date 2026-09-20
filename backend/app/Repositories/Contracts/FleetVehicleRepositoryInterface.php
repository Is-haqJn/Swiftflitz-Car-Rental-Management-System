<?php

namespace App\Repositories\Contracts;

use App\Models\FleetVehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface FleetVehicleRepositoryInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getVehicle(string $id): FleetVehicle;

    public function createVehicle(array $data): FleetVehicle;

    public function updateVehicle(string $id, array $data): FleetVehicle;

    public function deleteVehicle(string $id): bool;

    public function getAvailableForAirport(): Collection;

    public function getAvailableForChauffeur(bool $featuredOnly = false): Collection;
}
