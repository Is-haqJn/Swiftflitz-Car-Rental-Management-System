<?php

namespace App\Services\Contracts;

use App\DTOs\FleetVehicleData;
use App\Models\FleetVehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface FleetVehicleServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getVehicle(string $id): FleetVehicle;

    public function create(FleetVehicleData $data): FleetVehicle;

    public function update(string $id, FleetVehicleData $data): FleetVehicle;

    public function delete(string $id): bool;

    public function updateStatus(string $id, string $status): FleetVehicle;

    public function toggleActive(string $id): FleetVehicle;

    public function getAvailableForAirport(): Collection;

    public function getAvailableForChauffeur(bool $featuredOnly = false): Collection;

    public function setPrimaryPhoto(string $id, string $mediaId): FleetVehicle;

    public function assignServices(string $id, array $data): FleetVehicle;
}
