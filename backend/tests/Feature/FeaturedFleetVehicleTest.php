<?php

use App\Models\FleetServiceAssignment;
use App\Models\FleetVehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helper: create a fleet vehicle with a chauffeur service assignment */
function chauffeurVehicle(array $attrs = []): FleetVehicle
{
    $vehicle = FleetVehicle::factory()->available()->create($attrs);

    FleetServiceAssignment::factory()->create([
        'vehicle_id' => $vehicle->id,
        'service_type' => 'chauffeur',
        'is_active' => true,
    ]);

    return $vehicle;
}

it('returns only featured vehicles when featured=true query param is passed', function () {
    $featured = chauffeurVehicle(['is_featured' => true]);
    $notFeatured = chauffeurVehicle(['is_featured' => false]);

    $response = $this->getJson('/api/v1/public/chauffeur-vehicles?featured=true')
        ->assertSuccessful();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($featured->id)
        ->and($ids)->not->toContain($notFeatured->id);
});

it('returns all vehicles when featured param is absent', function () {
    $featured = chauffeurVehicle(['is_featured' => true]);
    $notFeatured = chauffeurVehicle(['is_featured' => false]);

    $response = $this->getJson('/api/v1/public/chauffeur-vehicles')
        ->assertSuccessful();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($featured->id)
        ->and($ids)->toContain($notFeatured->id);
});

it('fleet vehicle resource exposes is_featured field', function () {
    $vehicle = chauffeurVehicle(['is_featured' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/fleet-vehicles/{$vehicle->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.is_featured', true);
});
