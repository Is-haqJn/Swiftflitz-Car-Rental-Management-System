<?php

use App\Enums\VehicleStatus;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */
function vehiclePayload(array $overrides = []): array
{
    $category = Category::factory()->create();

    return array_merge([
        'category_id' => $category->id,
        'name' => 'Toyota Corolla',
        'make' => 'Toyota',
        'model' => 'Corolla',
        'year' => 2022,
        'license_plate' => 'GR-1234-AB',
        'color' => 'White',
        'seats' => 5,
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'daily_rate' => 150.00,
        'odometer' => 12000,
        'roadworthy_expiry_date' => now()->addYear()->toDateString(),
        'insurance_expiry_date' => now()->addYear()->toDateString(),
    ], $overrides);
}

/**
 * Create a super_admin user that bypasses all policy checks.
 */
function vehicleAdminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('super_admin'));

    return $user;
}

/* Authentication */
it('requires authentication to access vehicles', function () {
    $this->getJson('/api/v1/vehicles')->assertUnauthorized();
});

/* Index */
it('can access vehicles index', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/vehicles')
        ->assertSuccessful()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

it('can list featured vehicles', function () {
    $user = User::factory()->create();
    Vehicle::factory()->count(2)->featured()->create();
    Vehicle::factory()->count(3)->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/vehicles/featured')
        ->assertSuccessful();

    foreach ($response->json('data') as $vehicle) {
        expect($vehicle['is_featured'])->toBeTrue();
    }
});

/* Store */
it('can create a vehicle', function () {
    $user = vehicleAdminUser();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/vehicles', vehiclePayload())
        ->assertCreated()
        ->assertJsonPath('data.name', 'Toyota Corolla')
        ->assertJsonPath('data.make', 'Toyota');
});

it('denies vehicle creation without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/vehicles', vehiclePayload())
        ->assertForbidden();
});

it('validates required fields when creating a vehicle', function () {
    $user = vehicleAdminUser();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/vehicles', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'category_id', 'name', 'make', 'model', 'year',
            'license_plate', 'color', 'seats', 'fuel_type',
            'transmission', 'daily_rate',
            'roadworthy_expiry_date', 'insurance_expiry_date',
        ]);
});

it('rejects a duplicate license plate', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create(['license_plate' => 'GR-9999-XX']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/vehicles', vehiclePayload(['license_plate' => $vehicle->license_plate]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['license_plate']);
});

/* Show */
it('can show a vehicle', function () {
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/vehicles/{$vehicle->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $vehicle->id);
});

it('returns 404 for a non-existent vehicle', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/vehicles/non-existent-id')
        ->assertNotFound();
});

/* Update */
it('can update a vehicle', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/vehicles/{$vehicle->id}", [
            'color' => 'Midnight Blue',
            'condition_notes' => 'Minor scratch on rear bumper.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.color', 'Midnight Blue');
});

it('denies vehicle update without permission', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/vehicles/{$vehicle->id}", ['color' => 'Red'])
        ->assertForbidden();
});

/* Delete */
it('can delete a vehicle', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/vehicles/{$vehicle->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
});

it('denies vehicle deletion without permission', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/vehicles/{$vehicle->id}")
        ->assertForbidden();
});

/* Toggle Featured */
it('can toggle vehicle featured status', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create(['is_featured' => false]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/vehicles/{$vehicle->id}/toggle-featured")
        ->assertSuccessful()
        ->assertJsonPath('data.is_featured', true);

    // Toggle back off
    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/vehicles/{$vehicle->id}/toggle-featured")
        ->assertSuccessful()
        ->assertJsonPath('data.is_featured', false);
});

/* Toggle Price Visible */
it('can toggle vehicle price visibility', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create(['price_visible' => true]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/vehicles/{$vehicle->id}/toggle-price-visible")
        ->assertSuccessful()
        ->assertJsonPath('data.price_visible', false);

    // Toggle back on
    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/vehicles/{$vehicle->id}/toggle-price-visible")
        ->assertSuccessful()
        ->assertJsonPath('data.price_visible', true);
});

it('requires auth to toggle price visibility', function () {
    $vehicle = Vehicle::factory()->create();

    $this->patchJson("/api/v1/vehicles/{$vehicle->id}/toggle-price-visible")
        ->assertUnauthorized();
});

/* Change Status */
it('can change vehicle status', function () {
    $user = vehicleAdminUser();
    $vehicle = Vehicle::factory()->create(['status' => VehicleStatus::Available->value]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/vehicles/{$vehicle->id}/status", [
            'status' => VehicleStatus::Maintenance->value,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', VehicleStatus::Maintenance->value);
});
