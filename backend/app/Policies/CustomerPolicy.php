<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    /** Permissions that grant read access to the customers list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'customers.view_all',
        'customers.create',
        'customers.edit',
        'customers.blacklist',
        'customers.view_history',
        'customers.view_documents',
        'customers.manage_license_expired',
        'customers.manage_license_expiring',
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
     * Determine if the user can view any customers.
     * Any operational customer permission grants list access.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific customer.
     */
    public function view(User $user, Customer $customer): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create customers.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('customers.create');
    }

    /**
     * Determine if the user can update a specific customer.
     */
    public function update(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.edit');
    }

    /**
     * Determine if the user can delete a specific customer.
     */
    public function delete(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.delete');
    }

    /**
     * Determine if the user can toggle blacklist status for a customer.
     */
    public function toggleBlacklist(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.blacklist');
    }

    /**
     * Determine if the user can view customer documents.
     */
    public function viewDocuments(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.view_documents');
    }

    /**
     * Determine if the user can upload customer documents.
     */
    public function uploadDocuments(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.manage_documents');
    }

    /**
     * Determine if the user can manage customers with expired licenses.
     */
    public function manageLicenseExpired(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.manage_license_expired');
    }

    /**
     * Determine if the user can manage customers with expiring licenses.
     */
    public function manageLicenseExpiring(User $user, Customer $customer): bool
    {
        return $user->hasPermissionTo('customers.manage_license_expiring');
    }
}
