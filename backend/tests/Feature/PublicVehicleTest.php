<?php

use App\Enums\ChargeScope;
use App\Enums\ChargeType;
use App\Models\AdditionalCharge;
use App\Models\Branch;
use App\Models\Vehicle;
use App\Settings\PricingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists available vehicles without authentication', function () {
    Vehicle::factory()->count(3)->create(['status' => 'available']);

    $this->getJson('/api/v1/public/vehicles')
        ->assertSuccessful()
        ->assertJsonCount(3, 'data.vehicles');
});

it('includes rented vehicles so their unavailable dates can be shown', function () {
    Vehicle::factory()->create(['status' => 'available']);
    Vehicle::factory()->unavailable()->create(); // status = rented

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    expect(count($response->json('data.vehicles')))->toBe(2);
});

it('excludes maintenance and retired vehicles from the public listing', function () {
    Vehicle::factory()->create(['status' => 'available']);
    Vehicle::factory()->create(['status' => 'maintenance']);
    Vehicle::factory()->create(['status' => 'retired']);

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    expect(count($response->json('data.vehicles')))->toBe(1);
});

it('returns price_visible flag per vehicle so the frontend can decide display', function () {
    Vehicle::factory()->create(['status' => 'available', 'price_visible' => true]);
    Vehicle::factory()->create(['status' => 'available', 'price_visible' => false]);

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    expect(count($response->json('data.vehicles')))->toBe(2);

    $flags = collect($response->json('data.vehicles'))->pluck('price_visible')->toArray();
    expect($flags)->toContain(true)->toContain(false);
});

it('returns an empty vehicles list when all vehicles are retired or in maintenance', function () {
    Vehicle::factory()->create(['status' => 'retired']);
    Vehicle::factory()->create(['status' => 'maintenance']);

    $this->getJson('/api/v1/public/vehicles')
        ->assertSuccessful()
        ->assertJsonCount(0, 'data.vehicles');
});

it('does not require authentication to list public vehicles', function () {
    $this->getJson('/api/v1/public/vehicles')
        ->assertSuccessful();
});

it('includes show_prices_on_website from pricing settings', function () {
    app(PricingSettings::class)->show_prices_on_website = true;

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    expect($response->json('data.show_prices_on_website'))->toBeBool();
});

it('includes required vehicle fields in the response', function () {
    Vehicle::factory()->create(['status' => 'available']);

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    $vehicle = $response->json('data.vehicles.0');

    expect($vehicle)
        ->toHaveKeys(['id', 'name', 'make', 'model', 'year', 'seats', 'daily_rate', 'price_visible', 'features']);
});

it('includes currency fields on each vehicle in the public listing', function () {
    Vehicle::factory()->create(['status' => 'available']);

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    $vehicle = $response->json('data.vehicles.0');

    expect($vehicle)->toHaveKeys(['currency', 'global_currency', 'show_converted_price']);
});

it('exposes exchange_rate and daily_rate_global when vehicle is in a branch with a custom currency', function () {
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
        'show_converted_price' => true,
    ]);

    Vehicle::factory()->create([
        'status' => 'available',
        'branch_id' => $branch->id,
        'daily_rate' => 100.00,
    ]);

    $response = $this->getJson('/api/v1/public/vehicles')->assertSuccessful();

    $vehicle = $response->json('data.vehicles.0');

    expect($vehicle['exchange_rate'])->not->toBeNull()
        ->and($vehicle['daily_rate_global'])->not->toBeNull();
});

it('converts global addon amounts to branch currency in vehicle show endpoint', function () {
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $vehicle = Vehicle::factory()->create([
        'status' => 'available',
        'branch_id' => $branch->id,
    ]);

    /* Global addon (branch_id=null): stored in GHS, must be converted to NGN */
    AdditionalCharge::factory()->create([
        'scope' => ChargeScope::Regular->value,
        'charge_type' => ChargeType::Flat->value,
        'branch_id' => null,
        'amount' => 5.00,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/public/vehicles/{$vehicle->id}")->assertSuccessful();

    $addon = collect($response->json('data.vehicle.addons'))->first();

    /* 5 GHS / 0.0082 = 609.76 NGN */
    expect((float) $addon['amount'])->toBe(609.76);
});

it('does not convert branch-specific addon amounts in vehicle show endpoint', function () {
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $vehicle = Vehicle::factory()->create([
        'status' => 'available',
        'branch_id' => $branch->id,
    ]);

    /* Branch addon (branch_id set): already in branch currency, no conversion */
    AdditionalCharge::factory()->create([
        'scope' => ChargeScope::Regular->value,
        'charge_type' => ChargeType::Flat->value,
        'branch_id' => $branch->id,
        'amount' => 1000.00,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/public/vehicles/{$vehicle->id}")->assertSuccessful();

    $addon = collect($response->json('data.vehicle.addons'))->first();

    expect((float) $addon['amount'])->toBe(1000.00);
});

it('converts global auto_charge amounts to branch currency in vehicle show endpoint', function () {
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $vehicle = Vehicle::factory()->create([
        'status' => 'available',
        'branch_id' => $branch->id,
    ]);

    /* Global auto-charge (branch_id=null, scope=Global): stored in GHS */
    AdditionalCharge::factory()->create([
        'scope' => ChargeScope::Global->value,
        'charge_type' => ChargeType::Flat->value,
        'branch_id' => null,
        'amount' => 5.00,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/public/vehicles/{$vehicle->id}")->assertSuccessful();

    $charge = collect($response->json('data.vehicle.auto_charges'))->first();

    /* 5 GHS / 0.0082 = 609.76 NGN */
    expect((float) $charge['amount'])->toBe(609.76);
});

it('returns raw addon amounts when vehicle branch uses the global currency', function () {
    $vehicle = Vehicle::factory()->create([
        'status' => 'available',
        'branch_id' => null,
    ]);

    AdditionalCharge::factory()->create([
        'scope' => ChargeScope::Regular->value,
        'charge_type' => ChargeType::Flat->value,
        'branch_id' => null,
        'amount' => 50.00,
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/public/vehicles/{$vehicle->id}")->assertSuccessful();

    $addon = collect($response->json('data.vehicle.addons'))->first();

    expect((float) $addon['amount'])->toBe(50.00);
});
