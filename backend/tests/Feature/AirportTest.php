<?php

use App\Models\Airport;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Index */
it('returns a paginated list of airports', function () {
    Airport::factory(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airports')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('returns only active airports on the active endpoint', function () {
    Airport::factory(2)->create(['is_active' => true]);
    Airport::factory(1)->inactive()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airports/active')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can filter airports by is_active', function () {
    Airport::factory(2)->create(['is_active' => true]);
    Airport::factory(1)->inactive()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airports?filter[is_active]=1')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('requires authentication to list airports', function () {
    $this->getJson('/api/v1/airports')->assertUnauthorized();
});

/* Store */
it('creates an airport with valid data', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airports', [
            'name' => 'Kotoka International Airport',
            'city' => 'Accra',
            'country' => 'Ghana',
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Kotoka International Airport')
        ->assertJsonPath('data.city', 'Accra')
        ->assertJsonPath('data.country', 'Ghana')
        ->assertJsonPath('data.is_active', true);

    expect(Airport::where('name', 'Kotoka International Airport')->exists())->toBeTrue();
});

it('rejects creation when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airports', [
            'name' => 'Missing City Airport',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['city', 'country', 'is_active']);
});

/* Show */
it('returns a single airport', function () {
    $airport = Airport::factory()->create(['name' => 'Test Airport']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airports/{$airport->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $airport->id)
        ->assertJsonPath('data.name', 'Test Airport');
});

it('returns 404 for a non-existent airport', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airports/non-existent-uuid')
        ->assertNotFound();
});

/* Update */
it('updates an airport', function () {
    $airport = Airport::factory()->create(['name' => 'Old Name']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airports/{$airport->id}", [
            'name' => 'New Name',
            'city' => 'Lagos',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.city', 'Lagos');
});

it('supports partial updates via sometimes rules', function () {
    $airport = Airport::factory()->create(['city' => 'Accra', 'is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airports/{$airport->id}", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false)
        ->assertJsonPath('data.city', 'Accra');
});

/* Toggle Active */
it('toggles the active status of an airport', function () {
    $airport = Airport::factory()->create(['is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/airports/{$airport->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($airport->fresh()->is_active)->toBeFalse();
});

it('toggles an inactive airport back to active', function () {
    $airport = Airport::factory()->inactive()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/airports/{$airport->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', true);
});

/* Delete */
it('deletes an airport', function () {
    $airport = Airport::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/airports/{$airport->id}")
        ->assertNoContent();

    expect(Airport::find($airport->id))->toBeNull();
});
