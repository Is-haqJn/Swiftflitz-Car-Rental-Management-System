<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * Ensure each permission exists and grant them all to the user.
 *
 * @param  string[]  $names
 */
function grantVehiclePermissions(User $user, array $names): void
{
    foreach ($names as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
    $user->givePermissionTo($names);
}

/**
 * Build a valid vehicle payload so FormRequest validation passes
 * and the controller's authorize() gate is reached.
 */
function newVehiclePayload(): array
{
    $category = Category::factory()->create();
    $vehicle = Vehicle::factory()->make(['category_id' => $category->id]);

    return array_merge($vehicle->toArray(), ['category_id' => $category->id]);
}

/* Scenario A - Staff */
// Staff have operational vehicle permissions (manage_available, manage_maintenance)
// but NOT vehicles.view_all. After the policy fix they should be allowed to list
// vehicles (repository scopes results to their branch).

describe('Staff user (manage_available + manage_maintenance, no view_all)', function () {
    beforeEach(function () {
        $this->staff = User::factory()->create();
        $this->branch = Branch::factory()->create();
        $this->staff->branches()->attach($this->branch->id);

        grantVehiclePermissions($this->staff, [
            'vehicles.manage_available',
            'vehicles.manage_maintenance',
        ]);
    });

    it('allows listing vehicles', function () {
        $this->actingAs($this->staff, 'sanctum')
            ->getJson('/api/v1/vehicles')
            ->assertSuccessful()
            ->assertJsonPath('status', 'success');
    });

    it('denies creating a vehicle', function () {
        $this->actingAs($this->staff, 'sanctum')
            ->postJson('/api/v1/vehicles', newVehiclePayload())
            ->assertForbidden();
    });

    it('denies deleting a vehicle', function () {
        $vehicle = Vehicle::factory()->create(['branch_id' => $this->branch->id]);

        $this->actingAs($this->staff, 'sanctum')
            ->deleteJson("/api/v1/vehicles/{$vehicle->id}")
            ->assertForbidden();
    });
});

/* Scenario B - Viewer */
// Viewer has vehicles.view_all - read-only list access, cannot create or delete.

describe('Viewer user (view_all only)', function () {
    beforeEach(function () {
        $this->viewer = User::factory()->create();
        $this->branch = Branch::factory()->create();
        $this->viewer->branches()->attach($this->branch->id);

        grantVehiclePermissions($this->viewer, ['vehicles.view_all']);
    });

    it('allows listing vehicles', function () {
        $this->actingAs($this->viewer, 'sanctum')
            ->getJson('/api/v1/vehicles')
            ->assertSuccessful()
            ->assertJsonPath('status', 'success');
    });

    it('denies creating a vehicle', function () {
        $this->actingAs($this->viewer, 'sanctum')
            ->postJson('/api/v1/vehicles', newVehiclePayload())
            ->assertForbidden();
    });

    it('denies deleting a vehicle', function () {
        $vehicle = Vehicle::factory()->create(['branch_id' => $this->branch->id]);

        $this->actingAs($this->viewer, 'sanctum')
            ->deleteJson("/api/v1/vehicles/{$vehicle->id}")
            ->assertForbidden();
    });
});

/* Scenario C - No Permissions */
// A user with zero vehicle permissions should be denied the list endpoint.

describe('User with no vehicle permissions', function () {
    it('is denied listing vehicles (403)', function () {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vehicles')
            ->assertForbidden();
    });
});

/* Unauthenticated */
it('requires authentication to list vehicles', function () {
    $this->getJson('/api/v1/vehicles')->assertUnauthorized();
});
