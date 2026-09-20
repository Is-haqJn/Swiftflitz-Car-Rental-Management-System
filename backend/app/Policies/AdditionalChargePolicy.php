<?php

namespace App\Policies;

use App\Models\AdditionalCharge;
use App\Models\User;

class AdditionalChargePolicy
{
    /** Permissions that grant read access to the additional charges list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'rentals.manage_additional_charges',
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
     * Determine if the user can view any additional charges.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific additional charge.
     * Org-wide charges (branch_id = null) are visible to all users with relevant permissions.
     */
    public function view(User $user, AdditionalCharge $charge): bool
    {
        if (! $user->hasAnyPermission(self::VIEW_PERMISSIONS)) {
            return false;
        }

        if ($charge->branch_id === null) {
            return true;
        }

        /* Global users (no branch assignments) can view any branch's charges. */
        if (! $user->branches()->exists()) {
            return true;
        }

        return $user->branches()->where('branches.id', $charge->branch_id)->exists();
    }

    /**
     * Determine if the user can create additional charges.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('rentals.manage_additional_charges');
    }

    /**
     * Determine if the user can update a specific additional charge.
     * Org-wide charges (branch_id = null) can only be edited by users with no branch restrictions.
     */
    public function update(User $user, AdditionalCharge $charge): bool
    {
        if (! $user->hasPermissionTo('rentals.manage_additional_charges')) {
            return false;
        }

        if ($charge->branch_id === null) {
            /* Only global (non-branch-restricted) users can edit org-wide charges. */
            return ! $user->branches()->exists();
        }

        /* Global users (no branch assignments) can edit any branch's charges. */
        if (! $user->branches()->exists()) {
            return true;
        }

        return $user->branches()->where('branches.id', $charge->branch_id)->exists();
    }

    /**
     * Determine if the user can delete a specific additional charge.
     */
    public function delete(User $user, AdditionalCharge $charge): bool
    {
        return $this->update($user, $charge);
    }
}
