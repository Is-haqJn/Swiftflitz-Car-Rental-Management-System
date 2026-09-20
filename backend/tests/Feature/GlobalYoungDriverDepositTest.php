<?php

use App\Models\Category;
use App\Models\Vehicle;
use App\Services\PricingService;
use App\Settings\PricingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function globalDepositVehicle(array $vehicleAttrs = [], array $categoryAttrs = []): Vehicle
{
    $category = Category::factory()->create(array_merge([
        'young_driver_age_threshold' => null,
        'young_driver_deposit' => null,
        'security_deposit' => 200.00,
    ], $categoryAttrs));

    return Vehicle::factory()->create(array_merge([
        'category_id' => $category->id,
        'daily_rate' => 100.00,
        'security_deposit' => null,
        'young_driver_age_threshold' => null,
        'young_driver_deposit' => null,
    ], $vehicleAttrs));
}

it('applies global young driver deposit when vehicle and category have no threshold', function () {
    $settings = app(PricingSettings::class);
    $settings->global_young_driver_age_threshold = 25;
    $settings->global_young_driver_deposit = 600.00;
    $settings->save();

    $vehicle = globalDepositVehicle();

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 20);

    expect($deposit)->toBe(600.0);
});

it('vehicle level threshold overrides global young driver deposit', function () {
    $settings = app(PricingSettings::class);
    $settings->global_young_driver_age_threshold = 25;
    $settings->global_young_driver_deposit = 600.00;
    $settings->save();

    $vehicle = globalDepositVehicle([
        'young_driver_age_threshold' => 21,
        'young_driver_deposit' => 350.00,
    ]);

    $service = app(PricingService::class);

    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 20);
    expect($deposit)->toBe(350.0);
});

it('global threshold with vehicle deposit falls back to standard when customer is above threshold', function () {
    $settings = app(PricingSettings::class);
    $settings->global_young_driver_age_threshold = 25;
    $settings->global_young_driver_deposit = 600.00;
    $settings->global_security_deposit = 150.00;
    $settings->save();

    $vehicle = globalDepositVehicle();

    $service = app(PricingService::class);

    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 26);
    expect($deposit)->toBe(200.0);
});

it('global threshold set but global deposit is null falls through to standard deposit', function () {
    $settings = app(PricingSettings::class);
    $settings->global_young_driver_age_threshold = 25;
    $settings->global_young_driver_deposit = null;
    $settings->save();

    $vehicle = globalDepositVehicle([
        'security_deposit' => 180.00,
    ]);

    $service = app(PricingService::class);

    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 20);
    expect($deposit)->toBe(180.0);
});
