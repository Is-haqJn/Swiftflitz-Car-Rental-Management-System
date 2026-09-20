<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/discount-usages */
it('requires authentication to list discount usages', function () {
    $this->getJson('/api/v1/discount-usages')
        ->assertUnauthorized();
});

it('returns paginated discount usages for an authorised user', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/discount-usages')
        ->assertSuccessful();

    expect($response->json())->toHaveKey('data')
        ->and($response->json('data'))->toBeArray();
});

it('returns an empty list when no discount usages exist', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/discount-usages')
        ->assertSuccessful();

    expect($response->json('data'))->toBeEmpty();
});
