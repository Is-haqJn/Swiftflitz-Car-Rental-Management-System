<?php

namespace App\Services\Contracts;

use App\DTOs\AirportPackageAssignmentData;
use App\Models\AirportPackageAssignment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AirportPackageAssignmentServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getByAirport(string $airportId): Collection;

    public function getAssignment(string $id): AirportPackageAssignment;

    public function create(AirportPackageAssignmentData $data): AirportPackageAssignment;

    public function update(string $id, array $data): AirportPackageAssignment;

    public function delete(string $id): bool;

    public function toggleActive(string $id): AirportPackageAssignment;
}
