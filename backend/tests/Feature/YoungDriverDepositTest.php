<?php

use App\Models\Category;
use App\Models\Vehicle;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */

function youngDriverVehicle(array $vehicleAttrs = [], array $categoryAttrs = []): Vehicle
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

it('uses standard deposit when customer age is above threshold', function () {
    $vehicle = youngDriverVehicle([
        'young_driver_age_threshold' => 25,
        'young_driver_deposit' => 500.00,
        'security_deposit' => 200.00,
    ]);

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 26);

    expect($deposit)->toBe(200.0);
});

it('uses young driver deposit when customer age is below threshold', function () {
    $vehicle = youngDriverVehicle([
        'young_driver_age_threshold' => 25,
        'young_driver_deposit' => 500.00,
        'security_deposit' => 200.00,
    ]);

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 20);

    expect($deposit)->toBe(500.0);
});

it('falls back to standard deposit when no threshold is configured on vehicle or category', function () {
    $vehicle = youngDriverVehicle(
        ['security_deposit' => 150.00],
        ['security_deposit' => 150.00]
    );

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 20);

    expect($deposit)->toBe(150.0);
});

it('falls back to category threshold when vehicle has no threshold set', function () {
    $vehicle = youngDriverVehicle(
        [
            'young_driver_age_threshold' => null,
            'young_driver_deposit' => null,
            'security_deposit' => null,
        ],
        [
            'young_driver_age_threshold' => 25,
            'young_driver_deposit' => 400.00,
            'security_deposit' => 150.00,
        ]
    );

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: 22);

    expect($deposit)->toBe(400.0);
});

it('uses standard deposit when customer age is null (no dob)', function () {
    $vehicle = youngDriverVehicle([
        'young_driver_age_threshold' => 25,
        'young_driver_deposit' => 500.00,
        'security_deposit' => 200.00,
    ]);

    $service = app(PricingService::class);
    $deposit = $service->getDepositAmount($vehicle, skip: false, customerAge: null);

    expect($deposit)->toBe(200.0);
});

it('pricing preview endpoint returns young driver deposit when date_of_birth is passed', function () {
    $vehicle = youngDriverVehicle([
        'young_driver_age_threshold' => 25,
        'young_driver_deposit' => 500.00,
        'security_deposit' => 200.00,
    ]);

    /* 20-year-old customer */
    $dob = now()->subYears(20)->format('Y-m-d');

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", [
        'pickup_date' => '2026-06-01',
        'return_date' => '2026-06-04',
        'date_of_birth' => $dob,
    ])->assertStatus(200);

    expect((float) $response->json('data.depositAmount'))->toBe(500.0);
});
