<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    /** Permissions that grant read access to the branches list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'branches.view_all',
        'branches.create',
        'branches.edit',
        'branches.manage_members',
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
     * Determine if the user can view any branches.
     * Any branch-management permission grants list access.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific branch.
     */
    public function view(User $user, Branch $branch): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create branches.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('branches.create');
    }

    /**
     * Determine if the user can update a specific branch.
     */
    public function update(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.edit');
    }

    /**
     * Determine if the user can delete a specific branch.
     */
    public function delete(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.delete');
    }

    /**
     * Determine if the user can manage branch members (assign/remove managers).
     */
    public function manageMembers(User $user, Branch $branch): bool
    {
        return $user->hasPermissionTo('branches.manage_members');
    }
}
