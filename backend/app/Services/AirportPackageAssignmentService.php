<?php

namespace App\Services;

use App\DTOs\AirportPackageAssignmentData;
use App\Models\AirportPackageAssignment;
use App\Repositories\Contracts\AirportPackageAssignmentRepositoryInterface;
use App\Services\Contracts\AirportPackageAssignmentServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AirportPackageAssignmentService implements AirportPackageAssignmentServiceInterface
{
    public function __construct(
        protected AirportPackageAssignmentRepositoryInterface $assignmentRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->assignmentRepository->paginateFiltered();
    }

    public function getByAirport(string $airportId): Collection
    {
        return $this->assignmentRepository->getByAirport($airportId);
    }

    public function getAssignment(string $id): AirportPackageAssignment
    {
        return $this->assignmentRepository->getAssignment($id);
    }

    public function create(AirportPackageAssignmentData $data): AirportPackageAssignment
    {
        return $this->assignmentRepository->createAssignment($data->toArray());
    }

    public function update(string $id, array $data): AirportPackageAssignment
    {
        return $this->assignmentRepository->updateAssignment($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->assignmentRepository->deleteAssignment($id);
    }

    public function toggleActive(string $id): AirportPackageAssignment
    {
        $assignment = $this->assignmentRepository->findOrFail($id);
        $assignment->is_active = ! $assignment->is_active;
        $assignment->save();

        return $assignment->fresh();
    }
}
