<?php

namespace App\Repositories\Contracts;

use App\Repositories\Base\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find a role by its name.
     */
    public function findByName(string $name): ?Role;

    /**
     * Check if a role exists by its name.
     */
    public function existsByName(string $name): bool;

    /**
     * Get all roles with their permissions count.
     */
    public function getAllWithPermissionsCount(): Collection;
}
