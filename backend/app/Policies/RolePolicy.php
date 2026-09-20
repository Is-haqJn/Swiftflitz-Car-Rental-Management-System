<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    /** Permissions that grant read access to the roles list endpoint. */
    private const VIEW_PERMISSIONS = [
        'roles.view_all',
        'roles.create',
        'roles.edit',
    ];

    /**
     * Super admins bypass all policy checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine if the user can view any roles.
     * Any role-management permission grants list access.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create roles.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('roles.create');
    }

    /**
     * Determine if the user can update a specific role.
     */
    public function update(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('roles.edit');
    }

    /**
     * Determine if the user can delete a specific role.
     * Only super admins can delete roles (enforced via before() bypass).
     */
    public function delete(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('roles.delete');
    }
}
