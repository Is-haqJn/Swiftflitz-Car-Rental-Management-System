<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/roles */
it('requires authentication to list roles', function () {
    $this->getJson('/api/v1/roles')
        ->assertUnauthorized();
});

it('can list all roles', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/roles')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* GET /api/v1/roles/permissions */
it('requires authentication to list permissions', function () {
    $this->getJson('/api/v1/roles/permissions')
        ->assertUnauthorized();
});

it('can list all available permissions', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/roles/permissions')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* POST /api/v1/roles */
it('can create a new role', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/roles', [
            'name' => 'custom-manager',
            'permissions' => [],
        ])
        ->assertCreated()
        ->assertJsonPath('message', 'Role created successfully.');
});

it('validates required name when creating a role', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/roles', [])
        ->assertUnprocessable();
});

it('rejects duplicate role name', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'existing-role', 'guard_name' => 'web']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/roles', [
            'name' => 'existing-role',
        ])
        ->assertUnprocessable();
});

/* PUT /api/v1/roles/{role} */
it('can update a role', function () {
    Role::create(['name' => 'updatable-role', 'guard_name' => 'web']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/roles/updatable-role', [
            'name' => 'updatable-role',
            'permissions' => [],
        ])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Role updated successfully.');
});

/* DELETE /api/v1/roles/{role} */
it('can delete a custom role', function () {
    Role::create(['name' => 'deletable-role', 'guard_name' => 'web']);

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson('/api/v1/roles/deletable-role')
        ->assertNoContent();
});

/* GET /api/v1/roles/{role}/users */
it('can list users belonging to a role', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'test-role', 'guard_name' => 'web']);

    $targetUser = User::factory()->create();
    $targetUser->assignRole($role);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/roles/test-role/users')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray()
        ->and(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

it('returns empty list for role with no users', function () {
    $user = User::factory()->create();
    Role::create(['name' => 'empty-role', 'guard_name' => 'web']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/roles/empty-role/users')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray()
        ->and($response->json('data'))->toBeEmpty();
});
