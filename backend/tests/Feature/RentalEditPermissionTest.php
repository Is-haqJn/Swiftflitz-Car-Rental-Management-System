<?php

use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */

/**
 * Ensure the rentals.edit permission exists and grant it directly to the user.
 */
function grantRentalEditPermission(User $user): void
{
    $permission = Permission::firstOrCreate(['name' => 'rentals.edit', 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

/* Tests */

it('allows super_admin to edit rental details', function () {
    $rental = Rental::factory()->create();
    $superAdmin = adminUser();

    $this->actingAs($superAdmin, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", ['admin_notes' => 'super admin note'])
        ->assertSuccessful();
});

it('allows admin to edit rental details', function () {
    $rental = Rental::factory()->create();
    $admin = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $admin->assignRole($role);
    grantRentalEditPermission($admin);

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", ['admin_notes' => 'admin note'])
        ->assertSuccessful();
});

it('denies manager from editing rental details', function () {
    $rental = Rental::factory()->create();
    $manager = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
    $manager->assignRole($role);
    /* Do NOT grant rentals.edit - manager should be denied after config change */
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $manager->givePermissionTo('rentals.view_all');

    $this->actingAs($manager, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", ['admin_notes' => 'manager attempt'])
        ->assertForbidden();
});

it('denies staff from editing rental details', function () {
    $rental = Rental::factory()->create();
    $staff = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    $staff->assignRole($role);
    /* Do NOT grant rentals.edit - staff should be denied after config change */
    Permission::firstOrCreate(['name' => 'rentals.view_own', 'guard_name' => 'web']);
    $staff->givePermissionTo('rentals.view_own');

    $this->actingAs($staff, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", ['admin_notes' => 'staff attempt'])
        ->assertForbidden();
});

it('validates that vehicle_id and customer_id cannot be changed via edit', function () {
    $rental = Rental::factory()->create();
    $superAdmin = adminUser();

    $this->actingAs($superAdmin, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'vehicle_id' => 999,
            'customer_id' => 999,
        ])
        ->assertUnprocessable();
});
