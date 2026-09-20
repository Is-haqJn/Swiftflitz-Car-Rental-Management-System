<?php

use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

/* Schema checks */
it('vehicles table has young_driver_age_threshold column', function () {
    expect(Schema::hasColumn('vehicles', 'young_driver_age_threshold'))->toBeTrue();
});

it('vehicles table has young_driver_deposit column', function () {
    expect(Schema::hasColumn('vehicles', 'young_driver_deposit'))->toBeTrue();
});

it('categories table has young_driver_age_threshold column', function () {
    expect(Schema::hasColumn('categories', 'young_driver_age_threshold'))->toBeTrue();
});

it('categories table has young_driver_deposit column', function () {
    expect(Schema::hasColumn('categories', 'young_driver_deposit'))->toBeTrue();
});

/* Resource exposure checks */
it('vehicle resource exposes young_driver_age_threshold and young_driver_deposit', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('super_admin'));

    $vehicle = Vehicle::factory()->create([
        'young_driver_age_threshold' => 25,
        'young_driver_deposit' => 150.00,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson("/api/v1/vehicles/{$vehicle->id}")
        ->assertOk()
        ->assertJsonPath('data.young_driver_age_threshold', 25);

    expect((float) $response->json('data.young_driver_deposit'))->toBe(150.0);
});

it('category resource exposes young_driver_age_threshold and young_driver_deposit', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('super_admin'));

    $category = Category::factory()->create([
        'young_driver_age_threshold' => 23,
        'young_driver_deposit' => 200.00,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson("/api/v1/categories/{$category->id}")
        ->assertOk()
        ->assertJsonPath('data.young_driver_age_threshold', 23);

    expect((float) $response->json('data.young_driver_deposit'))->toBe(200.0);
});
