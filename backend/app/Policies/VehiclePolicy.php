<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vehicle;

class VehiclePolicy
{
    /** Permissions that grant read access to the vehicles list/detail endpoints. */
    private const VIEW_PERMISSIONS = [
        'vehicles.view_all',
        'vehicles.create',
        'vehicles.edit',
        'vehicles.manage_available',
        'vehicles.manage_rented',
        'vehicles.manage_maintenance',
        'vehicles.manage_categories',
        'vehicles.manage_features',
        'vehicles.manage_pricing',
        'vehicles.manage_availability',
        'vehicles.manage_insurance',
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
     * Determine if the user can view any vehicles.
     * Any operational vehicle permission grants list access; the repository
     * further scopes results to the user's assigned branches.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can view a specific vehicle.
     */
    public function view(User $user, Vehicle $vehicle): bool
    {
        return $user->hasAnyPermission(self::VIEW_PERMISSIONS);
    }

    /**
     * Determine if the user can create vehicles.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('vehicles.create');
    }

    /**
     * Determine if the user can update a specific vehicle.
     */
    public function update(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.edit');
    }

    /**
     * Determine if the user can delete a specific vehicle.
     */
    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.delete');
    }

    /**
     * Determine if the user can manage vehicle pricing.
     */
    public function managePricing(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_pricing');
    }

    /**
     * Determine if the user can manage vehicle availability.
     */
    public function manageAvailability(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_availability');
    }

    /**
     * Determine if the user can manage available vehicles.
     */
    public function manageAvailable(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_available');
    }

    /**
     * Determine if the user can manage rented vehicles.
     */
    public function manageRented(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_rented');
    }

    /**
     * Determine if the user can manage vehicle maintenance.
     */
    public function manageMaintenance(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_maintenance');
    }

    /**
     * Determine if the user can manage vehicle insurance.
     */
    public function manageInsurance(User $user, Vehicle $vehicle): bool
    {
        return $user->hasPermissionTo('vehicles.manage_insurance');
    }
}
