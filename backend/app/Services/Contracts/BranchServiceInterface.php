<?php

namespace App\Services\Contracts;

use App\DTOs\BranchData;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BranchServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getActive(): Collection;

    public function getBranch(string $id): Branch;

    public function create(BranchData $data): Branch;

    public function update(string $id, array $data): Branch;

    public function delete(string $id): bool;

    public function toggleActive(string $id): Branch;

    public function vacate(Branch $branch, array $data): void;

    public function syncManagers(Branch $branch, array $userIds): Branch;
}
