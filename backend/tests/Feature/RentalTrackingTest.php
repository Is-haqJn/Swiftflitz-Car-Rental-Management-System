<?php

use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns tracking info for a valid reference', function () {
    $rental = Rental::factory()->confirmed()->create([
        'reference' => 'RF-2026-TEST',
        'pickup_location' => 'Accra Main Office',
        'dropoff_location' => 'Airport Terminal 3',
    ]);

    $response = $this->getJson('/api/v1/public/rentals/track/RF-2026-TEST');

    $response->assertOk()
        ->assertJsonPath('data.reference', 'RF-2026-TEST')
        ->assertJsonPath('data.status', $rental->status->value)
        ->assertJsonStructure([
            'data' => [
                'reference',
                'status',
                'vehicle',
                'pickup_date',
                'return_date',
                'pickup_location',
                'dropoff_location',
            ],
        ]);
});

it('returns 404 for unknown reference', function () {
    $this->getJson('/api/v1/public/rentals/track/RF-DOES-NOT-EXIST')
        ->assertStatus(404)
        ->assertJsonPath('message', 'Rental not found.');
});

it('does not require authentication - no auth header needed', function () {
    Rental::factory()->confirmed()->create(['reference' => 'RF-2026-NOAUTH']);

    $this->getJson('/api/v1/public/rentals/track/RF-2026-NOAUTH')
        ->assertOk();
});

it('returns correct vehicle name format make model year', function () {
    $vehicle = Vehicle::factory()->create([
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2023,
    ]);

    Rental::factory()->confirmed()->create([
        'reference' => 'RF-2026-VEH',
        'vehicle_id' => $vehicle->id,
    ]);

    $response = $this->getJson('/api/v1/public/rentals/track/RF-2026-VEH');

    $response->assertOk()
        ->assertJsonPath('data.vehicle.name', 'Toyota Corolla (2023)');
});

it('returns null image when vehicle has no media', function () {
    Rental::factory()->confirmed()->create(['reference' => 'RF-2026-NOMEDIA']);

    $response = $this->getJson('/api/v1/public/rentals/track/RF-2026-NOMEDIA');

    $response->assertOk();

    expect($response->json('data.vehicle.image'))->toBeNull();
});
