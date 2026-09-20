<?php

namespace App\Policies;

use App\Models\Rental;
use App\Models\User;

class RentalPolicy
{
    /** Permissions that grant read access to the rentals list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'rentals.view_all',
        'rentals.view_own',
        'rentals.view_quotes',
        'rentals.manage_pending_bookings',
        'rentals.manage_active',
        'rentals.manage_overdue',
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
     * Determine if the user can view any rentals.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific rental.
     */
    public function view(User $user, Rental $rental): bool
    {
        if (! $user->hasAnyPermission(self::VIEW_PERMISSIONS)) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        $userBranchIds = $user->branches()->pluck('id')->toArray();

        if (empty($userBranchIds)) {
            return false;
        }

        return in_array($rental->branch_id, $userBranchIds, true);
    }

    /**
     * Determine if the user can create rentals.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('rentals.create');
    }

    /**
     * Determine if the user can update a specific rental.
     */
    public function update(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.edit');
    }

    /**
     * Determine if the user can delete a specific rental.
     */
    public function delete(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.delete');
    }

    /**
     * Determine if the user can confirm a rental booking.
     */
    public function confirm(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.update_status');
    }

    /**
     * Determine if the user can process a vehicle pickup.
     */
    public function processPickup(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.process_pickup');
    }

    /**
     * Alias for direct Gate ability checks (e.g. $user->can('pickup', $rental)).
     */
    public function pickup(User $user, Rental $rental): bool
    {
        return $this->processPickup($user, $rental);
    }

    /**
     * Determine if the user can process a vehicle return.
     */
    public function processReturn(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.mark_returned');
    }

    /**
     * Determine if the user can approve a vehicle return after inspection.
     */
    public function approveReturn(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.approve_return');
    }

    /**
     * Determine if the user can cancel a rental.
     */
    public function cancel(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.update_status');
    }

    /**
     * Determine if the user can settle a rental's outstanding balance.
     */
    public function settle(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.update_status');
    }

    /**
     * Determine if the user can send a payment link to the customer.
     */
    public function sendPaymentLink(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.send_payment_link');
    }

    /**
     * Determine if the user can upload video evidence to a rental.
     */
    public function uploadVideos(User $user, Rental $rental): bool
    {
        return $user->hasPermissionTo('rentals.manage_active');
    }
}
