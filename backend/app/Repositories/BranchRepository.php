<?php

namespace App\Repositories;

use App\Models\Branch;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\BranchRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BranchRepository extends QueryableRepository implements BranchRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at')->withCount('vehicles');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereIn('id', empty($branchIds) ? ['__none__'] : $branchIds);
        }

        return $base;
    }

    public function getAll(): Collection
    {
        return $this->getFiltered();
    }

    public function getActive(): Collection
    {
        return $this->query()->where('is_active', true)->with('airport')->get();
    }

    public function getBranch(string $id): Branch
    {
        return $this->query()->with('managers')->findOrFail($id);
    }

    public function createBranch(array $data): Branch
    {
        return $this->create($data);
    }

    public function updateBranch(string $id, array $data): Branch
    {
        return $this->update($id, $data);
    }

    public function deleteBranch(string $id): bool
    {
        return $this->delete($id);
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            AllowedFilter::exact('is_active'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['name', 'created_at'];
    }

    public function getDefaultIncludes(): array
    {
        return ['managers'];
    }

    protected function model(): string
    {
        return Branch::class;
    }
}
