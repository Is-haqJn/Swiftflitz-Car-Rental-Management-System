<?php

use App\Models\Airport;
use App\Models\AirportPackage;
use App\Models\AirportPackageAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Index */
it('returns a paginated list of airport packages', function () {
    AirportPackage::factory(4)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-packages')
        ->assertOk()
        ->assertJsonCount(4, 'data');
});

it('requires authentication to list packages', function () {
    $this->getJson('/api/v1/airport-packages')->assertUnauthorized();
});

/* Pickup / Dropoff filtered endpoints */
it('for-pickup returns only packages available for pickup', function () {
    AirportPackage::factory(2)->create(['is_available_for_pickup' => true, 'is_active' => true]);
    AirportPackage::factory(1)->dropoffOnly()->create();
    AirportPackage::factory(1)->create(['is_available_for_pickup' => true, 'is_active' => false]);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-packages/for-pickup')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('for-dropoff returns only packages available for dropoff', function () {
    AirportPackage::factory(3)->create(['is_available_for_dropoff' => true, 'is_active' => true]);
    AirportPackage::factory(1)->pickupOnly()->create();
    AirportPackage::factory(1)->create(['is_available_for_dropoff' => true, 'is_active' => false]);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-packages/for-dropoff')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('a package available for both shows up in both filtered endpoints', function () {
    $user = adminUser();
    AirportPackage::factory()->create([
        'is_available_for_pickup' => true,
        'is_available_for_dropoff' => true,
        'is_active' => true,
    ]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/airport-packages/for-pickup')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/airport-packages/for-dropoff')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

/* Store */
it('creates an airport package with valid data', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-packages', [
            'name' => 'Executive',
            'description' => 'Top-tier service with luxury vehicles.',
            'features' => ['Luxury SUV', 'Meet & greet', 'Flight tracking'],
            'is_available_for_pickup' => true,
            'is_available_for_dropoff' => true,
            'auto_assign_vehicle' => false,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Executive')
        ->assertJsonPath('data.auto_assign_vehicle', false);

    expect(AirportPackage::where('name', 'Executive')->exists())->toBeTrue();
});

it('stores features as an array', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-packages', [
            'name' => 'Basic',
            'features' => ['Standard sedan', 'No extra stops'],
            'is_available_for_pickup' => true,
            'is_available_for_dropoff' => false,
            'auto_assign_vehicle' => true,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.features.0', 'Standard sedan')
        ->assertJsonPath('data.features.1', 'No extra stops');
});

it('rejects creation when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-packages', ['name' => 'Incomplete'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['features', 'is_available_for_pickup', 'is_available_for_dropoff', 'auto_assign_vehicle', 'is_active']);
});

it('rejects non-string values inside features array', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-packages', [
            'name' => 'Bad Features',
            'features' => [123, true],
            'is_available_for_pickup' => true,
            'is_available_for_dropoff' => true,
            'auto_assign_vehicle' => true,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['features.0', 'features.1']);
});

/* Show */
it('returns a single airport package', function () {
    $package = AirportPackage::factory()->create(['name' => 'Comfort']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-packages/{$package->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Comfort');
});

/* Update */
it('updates an airport package', function () {
    $package = AirportPackage::factory()->create(['name' => 'Old']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airport-packages/{$package->id}", [
            'name' => 'Updated Premium',
            'is_available_for_dropoff' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Premium')
        ->assertJsonPath('data.is_available_for_dropoff', false);
});

/* Toggle Active */
it('toggles a package active status', function () {
    $package = AirportPackage::factory()->create(['is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/airport-packages/{$package->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($package->fresh()->is_active)->toBeFalse();
});

/* Delete */
it('deletes an airport package', function () {
    $package = AirportPackage::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/airport-packages/{$package->id}")
        ->assertNoContent();

    expect(AirportPackage::find($package->id))->toBeNull();
});

/* Package Assignments (pricing) */
it('creates a package assignment linking a package to an airport', function () {
    $airport = Airport::factory()->create();
    $package = AirportPackage::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-package-assignments', [
            'package_id' => $package->id,
            'airport_id' => $airport->id,
            'base_price' => 120.00,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.package_id', $package->id)
        ->assertJsonPath('data.airport_id', $airport->id)
        ->assertJsonPath('data.base_price', '120.00');
});

it('rejects a duplicate package+airport assignment', function () {
    $airport = Airport::factory()->create();
    $package = AirportPackage::factory()->create();

    AirportPackageAssignment::factory()->create([
        'package_id' => $package->id,
        'airport_id' => $airport->id,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-package-assignments', [
            'package_id' => $package->id,
            'airport_id' => $airport->id,
            'base_price' => 80.00,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['package_id']);
});

it('allows the same package to be assigned to different airports', function () {
    $user = adminUser();
    $airportA = Airport::factory()->create();
    $airportB = Airport::factory()->create();
    $package = AirportPackage::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/airport-package-assignments', [
            'package_id' => $package->id,
            'airport_id' => $airportA->id,
            'base_price' => 100.00,
            'is_active' => true,
        ])
        ->assertCreated();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/airport-package-assignments', [
            'package_id' => $package->id,
            'airport_id' => $airportB->id,
            'base_price' => 150.00,
            'is_active' => true,
        ])
        ->assertCreated();

    expect(AirportPackageAssignment::where('package_id', $package->id)->count())->toBe(2);
});

it('by-airport endpoint returns active assignments for an airport', function () {
    $airport = Airport::factory()->create();
    $otherAirport = Airport::factory()->create();

    AirportPackageAssignment::factory(2)->create(['airport_id' => $airport->id, 'is_active' => true]);
    AirportPackageAssignment::factory(1)->inactive()->create(['airport_id' => $airport->id]);
    AirportPackageAssignment::factory(3)->create(['airport_id' => $otherAirport->id, 'is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-package-assignments/by-airport/{$airport->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('updates a package assignment price', function () {
    $assignment = AirportPackageAssignment::factory()->create(['base_price' => 100.00]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airport-package-assignments/{$assignment->id}", [
            'base_price' => 200.00,
        ])
        ->assertOk()
        ->assertJsonPath('data.base_price', '200.00');
});

it('deletes a package assignment', function () {
    $assignment = AirportPackageAssignment::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/airport-package-assignments/{$assignment->id}")
        ->assertNoContent();

    expect(AirportPackageAssignment::find($assignment->id))->toBeNull();
});
