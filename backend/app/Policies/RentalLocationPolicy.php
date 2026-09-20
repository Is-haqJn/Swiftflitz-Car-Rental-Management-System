<?php

namespace App\Policies;

use App\Models\RentalLocation;
use App\Models\User;

class RentalLocationPolicy
{
    /** Permissions that grant read access to the rental locations list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'rentals.manage_locations',
        'rentals.view_all',
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
     * Determine if the user can view any rental locations.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific rental location.
     * Global users (no branch restrictions) can see all locations.
     */
    public function view(User $user, RentalLocation $location): bool
    {
        if (! $user->hasPermissionTo('rentals.manage_locations')) {
            return false;
        }

        if (! $user->branches()->exists()) {
            return true;
        }

        return $user->branches()->where('branches.id', $location->branch_id)->exists();
    }

    /**
     * Determine if the user can create rental locations.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('rentals.manage_locations');
    }

    /**
     * Determine if the user can update a specific rental location.
     * Global users can update any location; branch-restricted users only their own branch.
     */
    public function update(User $user, RentalLocation $location): bool
    {
        if (! $user->hasPermissionTo('rentals.manage_locations')) {
            return false;
        }

        if (! $user->branches()->exists()) {
            return true;
        }

        return $user->branches()->where('branches.id', $location->branch_id)->exists();
    }

    /**
     * Determine if the user can delete a specific rental location.
     */
    public function delete(User $user, RentalLocation $location): bool
    {
        return $this->update($user, $location);
    }
}
