<?php

namespace App\Policies;

use App\Models\QuoteRequest;
use App\Models\User;

class QuoteRequestPolicy
{
    /** Permissions that grant read access to quote requests. */
    private const VIEW_PERMISSIONS = [
        'rentals.view_quotes',
        'rentals.manage_quotes',
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
     * Determine if the user can view any quote requests.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific quote request.
     */
    public function view(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create quote requests.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('rentals.manage_quotes');
    }

    /**
     * Determine if the user can update a specific quote request.
     */
    public function update(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->hasPermissionTo('rentals.manage_quotes');
    }

    /**
     * Determine if the user can delete a specific quote request.
     */
    public function delete(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->hasPermissionTo('rentals.manage_quotes');
    }

    /**
     * Determine if the user can convert a quote request to a rental.
     */
    public function convert(User $user, QuoteRequest $quoteRequest): bool
    {
        return $user->hasPermissionTo('rentals.manage_quotes');
    }
}
