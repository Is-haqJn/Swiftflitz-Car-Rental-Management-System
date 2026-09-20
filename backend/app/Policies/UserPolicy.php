<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /** Permissions that grant read access to the users list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'users.view_all',
        'users.create',
        'users.edit',
        'users.assign_roles',
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
     * Determine if the user can view any users.
     * Any user-management permission grants list access.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific user.
     */
    public function view(User $user, User $model): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create users.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.create');
    }

    /**
     * Determine if the user can update a specific user.
     */
    public function update(User $user, User $model): bool
    {
        return $user->hasPermissionTo('users.edit');
    }

    /**
     * Determine if the user can delete a specific user.
     * Users cannot delete themselves.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->hasPermissionTo('users.delete') && $user->id !== $model->id;
    }

    /**
     * Determine if the user can impersonate another user.
     */
    public function impersonate(User $user, User $model): bool
    {
        return $user->hasPermissionTo('users.impersonate');
    }

    /**
     * Determine if the user can assign roles to other users.
     */
    public function assignRoles(User $user): bool
    {
        return $user->hasPermissionTo('users.assign_roles');
    }

    /**
     * Determine if the user can view activity logs.
     */
    public function viewActivityLogs(User $user): bool
    {
        return $user->hasRole(['super_admin', 'admin']);
    }
}
