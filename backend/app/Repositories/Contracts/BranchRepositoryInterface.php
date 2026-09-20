<?php

namespace App\Repositories\Contracts;

use App\Models\Branch;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface BranchRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(): Collection;

    public function getActive(): Collection;

    public function getBranch(string $id): Branch;

    public function createBranch(array $data): Branch;

    public function updateBranch(string $id, array $data): Branch;

    public function deleteBranch(string $id): bool;
}
