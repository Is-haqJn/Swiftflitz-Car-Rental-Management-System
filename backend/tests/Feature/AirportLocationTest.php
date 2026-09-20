<?php

use App\Models\Airport;
use App\Models\AirportLocation;
use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Index */
it('returns a paginated list of all airport locations', function () {
    $airport = Airport::factory()->create();
    $branch = Branch::factory()->create();

    AirportLocation::factory()->terminal($airport)->create();
    AirportLocation::factory()->area($branch)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-locations')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('requires authentication to list locations', function () {
    $this->getJson('/api/v1/airport-locations')->assertUnauthorized();
});

it('returns airport name in location list', function () {
    $airport = Airport::factory()->create(['name' => 'Kotoka International']);
    AirportLocation::factory()->terminal($airport)->create(['name' => 'Test Terminal']);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-locations')
        ->assertOk();

    expect($response->json('data.0.airport.name'))->toBe('Kotoka International');
});

/* Terminals endpoint (branch isolation) */
it('returns only terminals belonging to the requested airport', function () {
    $airportA = Airport::factory()->create();
    $airportB = Airport::factory()->create();

    AirportLocation::factory(2)->terminal($airportA)->create();
    AirportLocation::factory(3)->terminal($airportB)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/terminals?airport_id={$airportA->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('terminals endpoint excludes inactive terminals', function () {
    $airport = Airport::factory()->create();

    AirportLocation::factory(2)->terminal($airport)->create();
    AirportLocation::factory(1)->terminal($airport)->inactive()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/terminals?airport_id={$airport->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('terminals for airport A do not bleed into airport B results', function () {
    $airportA = Airport::factory()->create();
    $airportB = Airport::factory()->create();

    AirportLocation::factory(3)->terminal($airportA)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/terminals?airport_id={$airportB->id}")
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('returns 422 when airport_id is missing from terminals endpoint', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-locations/terminals')
        ->assertUnprocessable();
});

/* Areas endpoint (branch isolation) */
it('returns only area locations belonging to the requested branch', function () {
    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    AirportLocation::factory(2)->area($branchA)->create();
    AirportLocation::factory(4)->area($branchB)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branchA->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('areas endpoint excludes inactive areas', function () {
    $branch = Branch::factory()->create();

    AirportLocation::factory(3)->area($branch)->create();
    AirportLocation::factory(1)->area($branch)->inactive()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branch->id}")
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('areas for branch A do not bleed into branch B results', function () {
    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    AirportLocation::factory(3)->area($branchA)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branchB->id}")
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('returns 422 when branch_id is missing from areas endpoint', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-locations/areas')
        ->assertUnprocessable();
});

/* Store - terminal */
it('creates a terminal location linked to an airport', function () {
    $airport = Airport::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'terminal',
            'airport_id' => $airport->id,
            'name' => 'Terminal 3 International',
            'has_charge' => false,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.location_type', 'terminal')
        ->assertJsonPath('data.airport_id', $airport->id)
        ->assertJsonPath('data.branch_id', null);

    expect(AirportLocation::where('name', 'Terminal 3 International')->exists())->toBeTrue();
});

it('requires airport_id when location_type is terminal', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'terminal',
            'name' => 'No Airport Terminal',
            'has_charge' => false,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['airport_id']);
});

/* Store - area */
it('creates an area location linked to a branch', function () {
    $branch = Branch::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'area',
            'branch_id' => $branch->id,
            'name' => 'Cantonments Zone',
            'has_charge' => true,
            'charge_amount' => 25.00,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.location_type', 'area')
        ->assertJsonPath('data.branch_id', $branch->id)
        ->assertJsonPath('data.airport_id', null)
        ->assertJsonPath('data.has_charge', true)
        ->assertJsonPath('data.charge_amount', '25.00');
});

it('requires branch_id when location_type is area', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'area',
            'name' => 'No Branch Area',
            'has_charge' => false,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id']);
});

it('requires charge_amount when has_charge is true', function () {
    $branch = Branch::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'area',
            'branch_id' => $branch->id,
            'name' => 'Missing Charge',
            'has_charge' => true,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['charge_amount']);
});

it('rejects an invalid location_type', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-locations', [
            'location_type' => 'lounge',
            'name' => 'Bad Type',
            'has_charge' => false,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['location_type']);
});

/* Show */
it('returns a single airport location', function () {
    $location = AirportLocation::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-locations/{$location->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $location->id);
});

/* Update */
it('updates an airport location', function () {
    $location = AirportLocation::factory()->create(['name' => 'Old Name']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airport-locations/{$location->id}", [
            'name' => 'New Terminal Name',
            'is_active' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Terminal Name')
        ->assertJsonPath('data.is_active', false);
});

/* Toggle Active */
it('toggles a location active status', function () {
    $location = AirportLocation::factory()->create(['is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/airport-locations/{$location->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);
});

/* Delete */
it('deletes an airport location', function () {
    $location = AirportLocation::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/airport-locations/{$location->id}")
        ->assertNoContent();

    expect(AirportLocation::find($location->id))->toBeNull();
});

/* Cross-branch isolation summary */
it('area locations across multiple branches are correctly isolated', function () {
    $user = adminUser();
    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();
    $branchC = Branch::factory()->create();

    AirportLocation::factory(2)->area($branchA)->create();
    AirportLocation::factory(3)->area($branchB)->create();
    AirportLocation::factory(1)->area($branchC)->create();

    // Each branch sees only its own areas
    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branchA->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branchB->id}")
        ->assertOk()
        ->assertJsonCount(3, 'data');

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-locations/areas?branch_id={$branchC->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('terminal locations across multiple airports are correctly isolated', function () {
    $user = adminUser();
    $airportA = Airport::factory()->create();
    $airportB = Airport::factory()->create();

    AirportLocation::factory(2)->terminal($airportA)->create();
    AirportLocation::factory(4)->terminal($airportB)->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-locations/terminals?airport_id={$airportA->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-locations/terminals?airport_id={$airportB->id}")
        ->assertOk()
        ->assertJsonCount(4, 'data');
});
