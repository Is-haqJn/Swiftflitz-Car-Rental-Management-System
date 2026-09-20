<?php

namespace App\Repositories\Contracts;

use App\Models\AirportPackageAssignment;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AirportPackageAssignmentRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(): Collection;

    public function getByAirport(string $airportId): Collection;

    public function getAssignment(string $id): AirportPackageAssignment;

    public function createAssignment(array $data): AirportPackageAssignment;

    public function updateAssignment(string $id, array $data): AirportPackageAssignment;

    public function deleteAssignment(string $id): bool;
}
