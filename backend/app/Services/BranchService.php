<?php

namespace App\Services;

use App\DTOs\BranchData;
use App\Models\Branch;
use App\Models\Vehicle;
use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Services\Contracts\BranchServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BranchService implements BranchServiceInterface
{
    public function __construct(
        protected BranchRepositoryInterface $branchRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->branchRepository->paginateFiltered();
    }

    public function getActive(): Collection
    {
        return $this->branchRepository->getActive();
    }

    public function getBranch(string $id): Branch
    {
        return $this->branchRepository->getBranch($id);
    }

    public function create(BranchData $data): Branch
    {
        return $this->branchRepository->createBranch($data->toArray());
    }

    public function update(string $id, array $data): Branch
    {
        return $this->branchRepository->updateBranch($id, $data);
    }

    public function delete(string $id): bool
    {
        $branch = $this->branchRepository->getBranch($id);

        abort_if(
            $branch->vehicles()->exists(),
            422,
            'Cannot delete a branch that has vehicles assigned to it.'
        );

        return $this->branchRepository->deleteBranch($id);
    }

    public function toggleActive(string $id): Branch
    {
        $branch = $this->branchRepository->findOrFail($id);
        $branch->is_active = ! $branch->is_active;
        $branch->save();

        return $branch->fresh();
    }

    public function vacate(Branch $branch, array $data): void
    {
        if ($data['action'] === 'transfer') {
            Vehicle::where('branch_id', $branch->id)
                ->update(['branch_id' => $data['target_branch_id']]);
        } else {
            Vehicle::where('branch_id', $branch->id)
                ->update(['branch_id' => null]);
        }
    }

    public function syncManagers(Branch $branch, array $userIds): Branch
    {
        $branch->managers()->sync($userIds);

        return $branch->load('managers');
    }
}
