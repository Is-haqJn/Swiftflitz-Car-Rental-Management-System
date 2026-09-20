<?php

namespace App\Policies;

use App\Models\DiscountRule;
use App\Models\User;

class DiscountRulePolicy
{
    /** Permissions that grant read access to the discount rules list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'discounts.view_all',
        'discounts.create',
        'discounts.edit',
        'discounts.delete',
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
     * Determine if the user can view any discount rules.
     * Any discount permission grants list access.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific discount rule.
     * Org-wide rules (branch_id = null) are visible to any user with a discount permission.
     * Branch-specific rules require branch membership.
     */
    public function view(User $user, DiscountRule $rule): bool
    {
        if (! $user->hasAnyPermission(self::VIEW_PERMISSIONS)) {
            return false;
        }

        if ($rule->branch_id === null) {
            return true;
        }

        return $user->branches()->where('branches.id', $rule->branch_id)->exists();
    }

    /**
     * Determine if the user can create discount rules.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('discounts.create');
    }

    /**
     * Determine if the user can update a specific discount rule.
     * Org-wide rules (branch_id = null) can only be edited by users with no branch restrictions.
     */
    public function update(User $user, DiscountRule $rule): bool
    {
        if (! $user->hasPermissionTo('discounts.edit')) {
            return false;
        }

        if ($rule->branch_id === null) {
            /* Only global (non-branch-restricted) users can edit org-wide rules. */
            return ! $user->branches()->exists();
        }

        return $user->branches()->where('branches.id', $rule->branch_id)->exists();
    }

    /**
     * Determine if the user can delete a specific discount rule.
     * Org-wide rules (branch_id = null) can only be deleted by users with no branch restrictions.
     */
    public function delete(User $user, DiscountRule $rule): bool
    {
        if (! $user->hasPermissionTo('discounts.delete')) {
            return false;
        }

        if ($rule->branch_id === null) {
            return ! $user->branches()->exists();
        }

        return $user->branches()->where('branches.id', $rule->branch_id)->exists();
    }
}
