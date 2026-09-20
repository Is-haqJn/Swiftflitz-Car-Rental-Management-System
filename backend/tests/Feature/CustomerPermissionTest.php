<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * Ensure each permission exists and grant them all to the user.
 *
 * @param  string[]  $names
 */
function grantCustomerPermissions(User $user, array $names): void
{
    foreach ($names as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
    $user->givePermissionTo($names);
}

/**
 * Build a valid customer payload so FormRequest validation passes
 * and the controller's authorize() gate is reached.
 */
function newCustomerPayload(): array
{
    return Customer::factory()->make()->toArray();
}

/* Scenario A - Staff */
// Staff have manage_license_expired / manage_license_expiring but NOT view_all.
// After the policy fix they should be allowed to list customers.

describe('Staff user (manage_license_expired + manage_license_expiring, no view_all)', function () {
    beforeEach(function () {
        $this->staff = User::factory()->create();

        grantCustomerPermissions($this->staff, [
            'customers.manage_license_expired',
            'customers.manage_license_expiring',
        ]);
    });

    it('allows listing customers', function () {
        $this->actingAs($this->staff, 'sanctum')
            ->getJson('/api/v1/customers')
            ->assertSuccessful()
            ->assertJsonPath('status', 'success');
    });

    it('denies creating a customer', function () {
        $this->actingAs($this->staff, 'sanctum')
            ->postJson('/api/v1/customers', newCustomerPayload())
            ->assertForbidden();
    });

    it('denies deleting a customer', function () {
        $customer = Customer::factory()->create();

        $this->actingAs($this->staff, 'sanctum')
            ->deleteJson("/api/v1/customers/{$customer->id}")
            ->assertForbidden();
    });
});

/* Scenario B - Viewer */
// Viewer has customers.view_all - read-only access.

describe('Viewer user (view_all only)', function () {
    beforeEach(function () {
        $this->viewer = User::factory()->create();

        grantCustomerPermissions($this->viewer, ['customers.view_all']);
    });

    it('allows listing customers', function () {
        $this->actingAs($this->viewer, 'sanctum')
            ->getJson('/api/v1/customers')
            ->assertSuccessful()
            ->assertJsonPath('status', 'success');
    });

    it('allows viewing a single customer', function () {
        $customer = Customer::factory()->create();

        $this->actingAs($this->viewer, 'sanctum')
            ->getJson("/api/v1/customers/{$customer->id}")
            ->assertSuccessful();
    });

    it('denies creating a customer', function () {
        $this->actingAs($this->viewer, 'sanctum')
            ->postJson('/api/v1/customers', newCustomerPayload())
            ->assertForbidden();
    });

    it('denies deleting a customer', function () {
        $customer = Customer::factory()->create();

        $this->actingAs($this->viewer, 'sanctum')
            ->deleteJson("/api/v1/customers/{$customer->id}")
            ->assertForbidden();
    });
});

/* Scenario C - No Permissions */
// A user with zero customer permissions should be denied the list endpoint.

describe('User with no customer permissions', function () {
    it('is denied listing customers (403)', function () {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/customers')
            ->assertForbidden();
    });
});

/* Unauthenticated */
it('requires authentication to list customers', function () {
    $this->getJson('/api/v1/customers')->assertUnauthorized();
});
