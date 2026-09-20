<?php

use App\Models\Branch;
use App\Models\RentalLocation;
use App\Services\Contracts\PricingServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns location charge unchanged when vehicleBranchRate is null (global-currency branch)', function () {
    /** @var PricingServiceInterface $service */
    $service = app(PricingServiceInterface::class);

    $branch = Branch::factory()->create();

    $location = RentalLocation::factory()->create([
        'branch_id' => $branch->id,
        'pickup_charge' => 50.00,
        'is_active' => true,
        'is_pickup' => true,
    ]);

    /* vehicleBranchRate = null means vehicle branch uses global currency - no conversion */
    $result = $service->getLocationCharges($location->id, null, null);

    expect((float) $result['total'])->toBe(50.0)
        ->and((float) $result['items'][0]['amount'])->toBe(50.0);
});

it('does not convert a branch-owned location charge even when vehicleBranchRate is set', function () {
    /** @var PricingServiceInterface $service */
    $service = app(PricingServiceInterface::class);

    /* NGN branch: locations stored in NGN already */
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    /* Charge is already in NGN (branch_id !== null) - must NOT be converted */
    $location = RentalLocation::factory()->create([
        'branch_id' => $branch->id,
        'pickup_charge' => 6000.00,
        'is_active' => true,
        'is_pickup' => true,
    ]);

    $result = $service->getLocationCharges($location->id, null, 0.0082);

    expect((float) $result['total'])->toBe(6000.0)
        ->and((float) $result['items'][0]['amount'])->toBe(6000.0);
});

it('calculates pickup and dropoff charges together correctly', function () {
    /** @var PricingServiceInterface $service */
    $service = app(PricingServiceInterface::class);

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $pickup = RentalLocation::factory()->create([
        'branch_id' => $branch->id,
        'pickup_charge' => 2000.00,
        'dropoff_charge' => 0.00,
        'is_active' => true,
        'is_pickup' => true,
        'is_dropoff' => false,
    ]);

    $dropoff = RentalLocation::factory()->create([
        'branch_id' => $branch->id,
        'pickup_charge' => 0.00,
        'dropoff_charge' => 3000.00,
        'is_active' => true,
        'is_pickup' => false,
        'is_dropoff' => true,
    ]);

    $result = $service->getLocationCharges($pickup->id, $dropoff->id, 0.0082);

    /* Both branch-owned: no FX conversion. Total = 2000 + 3000 = 5000 */
    expect((float) $result['total'])->toBe(5000.0)
        ->and(count($result['items']))->toBe(2);
});
