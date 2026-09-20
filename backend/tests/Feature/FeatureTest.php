<?php

use App\Models\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Authentication */
it('requires authentication to access features', function () {
    $this->getJson('/api/v1/features')->assertUnauthorized();
});

/* Index */
it('can list features', function () {
    $user = User::factory()->create();
    Feature::factory()->count(3)->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/features')
        ->assertSuccessful()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('can list active features only', function () {
    $user = User::factory()->create();
    Feature::factory()->count(2)->create(['is_active' => true]);
    Feature::factory()->count(2)->create(['is_active' => false]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/features/active')
        ->assertSuccessful();

    foreach ($response->json('data') as $item) {
        expect($item['is_active'])->toBeTrue();
    }
});

/* Store */
it('can create a feature', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/features', ['name' => 'GPS Navigation'])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'GPS Navigation');
});

it('validates required name when creating a feature', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/features', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

/* Show */
it('can show a feature', function () {
    $user = User::factory()->create();
    $feature = Feature::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/features/{$feature->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $feature->id);
});

it('returns 404 for a non-existent feature', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/features/non-existent-id')
        ->assertNotFound();
});

/* Update */
it('can update a feature', function () {
    $user = User::factory()->create();
    $feature = Feature::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/features/{$feature->id}", [
            'name' => 'Sunroof',
            'description' => 'Panoramic sunroof.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Sunroof');
});

/* Delete */
it('can delete a feature', function () {
    $user = User::factory()->create();
    $feature = Feature::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/features/{$feature->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('features', ['id' => $feature->id]);
});
