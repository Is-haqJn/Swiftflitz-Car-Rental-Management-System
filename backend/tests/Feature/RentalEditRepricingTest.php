<?php

use App\Enums\RentalStatus;
use App\Models\Rental;
use App\Models\RentalLocation;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function grantEditForRepricingTest(User $user): void
{
    $permission = Permission::firstOrCreate(['name' => 'rentals.edit', 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

it('recalculates rental_days and total_cost when return_date changes on pending rental', function () {
    $user = User::factory()->create();
    grantEditForRepricingTest($user);

    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Pending,
        'pickup_date' => '2027-06-01',
        'return_date' => '2027-06-05',
        'rental_days' => 4,
        'daily_rate' => 100.00,
        'base_cost' => 400.00,
        'subtotal' => 400.00,
        'total_cost' => 400.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'return_date' => '2027-06-08',
        ])
        ->assertSuccessful();

    $data = $response->json('data');
    expect((int) $data['rental_days'])->toBe(7)
        ->and((float) $data['total_cost'])->toBeGreaterThan(400.0);
});

it('recalculates base_cost when pickup_date changes on pending rental', function () {
    $user = User::factory()->create();
    grantEditForRepricingTest($user);

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00]);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Pending,
        'pickup_date' => '2027-06-01',
        'return_date' => '2027-06-06',
        'rental_days' => 5,
        'daily_rate' => 200.00,
        'base_cost' => 1000.00,
        'subtotal' => 1000.00,
        'total_cost' => 1000.00,
    ]);

    /* Shorten to 3 days by moving pickup forward */
    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_date' => '2027-06-03',
        ])
        ->assertSuccessful();

    $data = $response->json('data');
    expect((int) $data['rental_days'])->toBe(3)
        ->and((float) $data['total_cost'])->toBeLessThan(1000.0);
});

it('recalculates location_charge when pickup location changes on pending rental', function () {
    $user = User::factory()->create();
    grantEditForRepricingTest($user);

    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Pending,
        'pickup_date' => '2027-07-01',
        'return_date' => '2027-07-04',
        'rental_days' => 3,
        'daily_rate' => 100.00,
        'base_cost' => 300.00,
        'subtotal' => 300.00,
        'total_cost' => 300.00,
        'location_charge' => 0.00,
    ]);

    $location = RentalLocation::factory()->create([
        'is_active' => true,
        'is_pickup' => true,
        'pickup_charge' => 50.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_location_id' => $location->id,
        ])
        ->assertSuccessful();

    $data = $response->json('data');
    expect((float) $data['location_charge'])->toBe(50.0)
        ->and((float) $data['total_cost'])->toBe(350.0);
});

it('recalculates location_charge when dropoff location changes on confirmed rental', function () {
    $user = User::factory()->create();
    grantEditForRepricingTest($user);

    $vehicle = Vehicle::factory()->create(['daily_rate' => 150.00]);

    $rental = Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Confirmed,
        'pickup_date' => '2027-08-01',
        'return_date' => '2027-08-03',
        'rental_days' => 2,
        'daily_rate' => 150.00,
        'base_cost' => 300.00,
        'subtotal' => 300.00,
        'total_cost' => 300.00,
        'location_charge' => 0.00,
    ]);

    $location = RentalLocation::factory()->create([
        'is_active' => true,
        'is_dropoff' => true,
        'dropoff_charge' => 30.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'dropoff_location_id' => $location->id,
        ])
        ->assertSuccessful();

    $data = $response->json('data');
    expect((float) $data['location_charge'])->toBe(30.0)
        ->and((float) $data['total_cost'])->toBe(330.0);
});

it('updates pickup_location name snapshot when location id changes', function () {
    $user = User::factory()->create();
    grantEditForRepricingTest($user);

    $rental = Rental::factory()->create([
        'status' => RentalStatus::Pending,
        'pickup_location' => null,
        'pickup_date' => '2027-09-01',
        'return_date' => '2027-09-03',
    ]);

    $location = RentalLocation::factory()->create([
        'name' => 'Airport Terminal 1',
        'is_active' => true,
        'is_pickup' => true,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_location_id' => $location->id,
        ])
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['pickup_location'])->toBe('Airport Terminal 1');
});
