<?php

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/users */
it('requires authentication to list users', function () {
    $this->getJson('/api/v1/users')
        ->assertUnauthorized();
});

it('can list all users', function () {
    User::factory()->count(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/users')
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');
});

it('paginates the user list', function () {
    User::factory()->count(5)->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/users?per_page=2')
        ->assertSuccessful();

    expect($response->json('data'))->toHaveCount(2);
});

/* POST /api/v1/users */
it('can create a new user', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'username' => 'janedoe',
            'password' => 'Password123!',
        ])
        ->assertCreated()
        ->assertJsonPath('data.email', 'jane@example.com');
});

it('validates required fields when creating a user', function () {
    $actor = User::factory()->create();

    $this->actingAs($actor, 'sanctum')
        ->postJson('/api/v1/users', [])
        ->assertUnprocessable();
});

it('rejects duplicate email when creating a user', function () {
    $actor = User::factory()->create();
    User::factory()->create(['email' => 'duplicate@example.com']);

    $this->actingAs($actor, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'duplicate@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
        ->assertUnprocessable();
});

/* GET /api/v1/users/{user} */
it('can show a specific user', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($actor, 'sanctum')
        ->getJson("/api/v1/users/{$target->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $target->id);
});

it('returns 404 for a non-existent user', function () {
    $actor = User::factory()->create();

    $this->actingAs($actor, 'sanctum')
        ->getJson('/api/v1/users/99999')
        ->assertNotFound();
});

/* PUT /api/v1/users/{user} */
it('can update a user', function () {
    $target = User::factory()->create(['username' => 'targetuser', 'email' => 'target@example.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/users/{$target->id}", [
            'name' => 'Updated Name',
            'email' => 'target@example.com',
            'username' => 'targetuser',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated Name');
});

/* DELETE /api/v1/users/{user} */
it('can delete a user', function () {
    $target = User::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/users/{$target->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

/* PATCH /api/v1/users/{user}/toggle-active */
it('can toggle a user active status', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create(['is_active' => true]);

    $response = $this->actingAs($actor, 'sanctum')
        ->patchJson("/api/v1/users/{$target->id}/toggle-active")
        ->assertSuccessful();

    expect($response->json('data.is_active'))->toBeFalse();
});

it('activates an inactive user on toggle', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create(['is_active' => false]);

    $response = $this->actingAs($actor, 'sanctum')
        ->patchJson("/api/v1/users/{$target->id}/toggle-active")
        ->assertSuccessful();

    expect($response->json('data.is_active'))->toBeTrue();
});

/* PUT /api/v1/users/{user}/roles */
it('can assign roles to a user', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    Role::create(['name' => 'manager', 'guard_name' => 'web']);

    $this->actingAs($actor, 'sanctum')
        ->putJson("/api/v1/users/{$target->id}/roles", [
            'roles' => ['manager'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Roles updated successfully.');
});

it('validates roles must be an array when assigning roles', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($actor, 'sanctum')
        ->putJson("/api/v1/users/{$target->id}/roles", [
            'roles' => 'not-an-array',
        ])
        ->assertUnprocessable();
});

/* PUT /api/v1/users/{user}/permissions */
it('can assign permissions to a user', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    Permission::create(['name' => 'test.view', 'guard_name' => 'web']);

    $this->actingAs($actor, 'sanctum')
        ->putJson("/api/v1/users/{$target->id}/permissions", [
            'permissions' => ['test.view'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Permissions updated successfully.');
});

/* DELETE /api/v1/users/{user}/sessions */
it('can revoke all sessions for a user', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();
    $target->createToken('test-token');

    $this->actingAs($actor, 'sanctum')
        ->deleteJson("/api/v1/users/{$target->id}/sessions")
        ->assertSuccessful()
        ->assertJsonPath('message', 'All sessions revoked successfully.');
});

/* GET /api/v1/users/roles/available */
it('can list available roles', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/users/roles/available')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* GET /api/v1/users/permissions/available */
it('can list available permissions', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/users/permissions/available')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* POST /api/v1/users/{user}/branches */
it('allows saving user with zero branches assigned', function () {
    $user = User::factory()->create();
    $branch = Branch::factory()->create();
    $user->branches()->attach($branch->id);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/users/{$user->id}/branches", ['branch_ids' => []])
        ->assertOk()
        ->assertJsonPath('message', 'Branch assignments updated successfully.');

    expect($user->fresh()->branches()->count())->toBe(0);
});

it('allows assigning a branch to a user', function () {
    $user = User::factory()->create();
    $branch = Branch::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/users/{$user->id}/branches", ['branch_ids' => [$branch->id]])
        ->assertOk()
        ->assertJsonPath('message', 'Branch assignments updated successfully.');

    expect($user->fresh()->branches()->count())->toBe(1);
});

/* GET /api/v1/activity-logs */
it('requires authentication to view activity logs', function () {
    $this->getJson('/api/v1/activity-logs')
        ->assertUnauthorized();
});

it('can list activity logs', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/activity-logs')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* POST /api/v1/users/{user}/impersonate */
it('allows super admin to impersonate a user', function () {
    $admin = adminUser();
    $target = User::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/users/{$target->id}/impersonate")
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');
});

it('denies impersonation to user without users.impersonate permission', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($actor, 'sanctum')
        ->postJson("/api/v1/users/{$target->id}/impersonate")
        ->assertForbidden();
});

it('allows impersonation when users.impersonate permission is explicitly granted', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    Permission::firstOrCreate(
        ['name' => 'users.impersonate', 'guard_name' => 'web']
    );
    $actor->givePermissionTo('users.impersonate');

    $this->actingAs($actor, 'sanctum')
        ->postJson("/api/v1/users/{$target->id}/impersonate")
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');
});
