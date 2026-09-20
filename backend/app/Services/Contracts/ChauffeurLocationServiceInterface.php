<?php

namespace App\Services\Contracts;

use App\DTOs\ChauffeurLocationData;
use App\Models\ChauffeurLocation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChauffeurLocationServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function getLocation(string $id): ChauffeurLocation;

    public function create(ChauffeurLocationData $data): ChauffeurLocation;

    public function update(string $id, array $data): ChauffeurLocation;

    public function delete(string $id): bool;
}
