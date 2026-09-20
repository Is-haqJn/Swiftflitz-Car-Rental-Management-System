<?php

namespace App\Repositories;

use App\Repositories\Base\BaseRepository;
use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    /**
     * Find a role by its name.
     */
    public function findByName(string $name): ?Role
    {
        return $this->model->where('name', $name)->first();
    }

    /**
     * Check if a role exists by its name.
     */
    public function existsByName(string $name): bool
    {
        return $this->model->where('name', $name)->exists();
    }

    /**
     * Get all roles with their permissions count.
     */
    public function getAllWithPermissionsCount(): Collection
    {
        return $this->model->withCount('permissions')->orderBy('name')->get();
    }

    /**
     * Specify the model class name.
     */
    protected function model(): string
    {
        return Role::class;
    }
}
