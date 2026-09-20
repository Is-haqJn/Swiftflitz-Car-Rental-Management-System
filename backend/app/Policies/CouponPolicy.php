<?php

namespace App\Policies;

use App\Models\DiscountCoupon;
use App\Models\User;

class CouponPolicy
{
    /** Permissions that grant read access to the coupons list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'coupons.view_all',
        'coupons.create',
        'coupons.edit',
        'coupons.delete',
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
     * Determine if the user can view any coupons.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific coupon.
     */
    public function view(User $user, DiscountCoupon $coupon): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create coupons.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('coupons.create');
    }

    /**
     * Determine if the user can update a specific coupon.
     */
    public function update(User $user, DiscountCoupon $coupon): bool
    {
        return $user->hasPermissionTo('coupons.edit');
    }

    /**
     * Determine if the user can delete a specific coupon.
     */
    public function delete(User $user, DiscountCoupon $coupon): bool
    {
        return $user->hasPermissionTo('coupons.delete');
    }
}
