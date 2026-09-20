<?php

use App\Enums\ChargeScope;
use App\Enums\ChargeType;
use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use App\Models\AdditionalCharge;
use App\Models\DiscountRule;
use App\Models\Vehicle;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */

function pricingPayload(string $vehicleId, array $overrides = []): array
{
    return array_merge([
        'pickup_date' => '2026-05-01',
        'return_date' => '2026-05-04',
    ], $overrides);
}

/* POST /api/v1/public/vehicles/{id}/pricing-preview */

it('returns a pricing breakdown for a vehicle with no addons or discounts', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", pricingPayload($vehicle->id))
        ->assertStatus(200);

    expect($response->json('data.rentalDays'))->toBe(3)
        ->and((float) $response->json('data.base'))->toBe(300.0)
        ->and((float) $response->json('data.totalAmount'))->toBe(300.0);
});

it('includes auto-charges in the total', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    AdditionalCharge::create([
        'name' => 'Insurance',
        'scope' => ChargeScope::Global->value,
        'charge_type' => ChargeType::Flat->value,
        'amount' => 50.00,
        'is_active' => true,
    ]);

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", pricingPayload($vehicle->id))
        ->assertStatus(200);

    expect((float) $response->json('data.totalAmount'))->toBe(350.0)
        ->and((float) $response->json('data.addonTotal'))->toBe(50.0);
});

it('applies discount rules and reduces the total', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00]);

    DiscountRule::create([
        'name' => 'Flat 50 off',
        'discount_type' => DiscountType::Flat->value,
        'discount_value' => 50.00,
        'condition_type' => DiscountConditionType::None->value,
        'is_active' => true,
        'is_stackable' => false,
    ]);

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", pricingPayload($vehicle->id))
        ->assertStatus(200);

    /* base = 200 * 3 = 600, discount = 50, total = 550 */
    expect((float) $response->json('data.totalAmount'))->toBe(550.0)
        ->and((float) $response->json('data.ruleDiscountAmount'))->toBe(50.0);
});

it('includes user-selected addon charges', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    $addon = AdditionalCharge::create([
        'name' => 'Child Seat',
        'scope' => ChargeScope::Regular->value,
        'charge_type' => ChargeType::Flat->value,
        'amount' => 40.00,
        'is_active' => true,
    ]);

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", [
        'pickup_date' => '2026-05-01',
        'return_date' => '2026-05-04',
        'addon_ids' => [$addon->id],
    ])->assertStatus(200);

    /* base = 300, addon = 40, total = 340 */
    expect((float) $response->json('data.totalAmount'))->toBe(340.0);
});

it('returns 404 for a non-existent vehicle', function () {
    $this->postJson('/api/v1/public/vehicles/00000000-0000-0000-0000-000000000099/pricing-preview', pricingPayload(''))
        ->assertStatus(404);
});

it('returns 422 when pickup_date is missing', function () {
    $vehicle = Vehicle::factory()->create();

    $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", ['return_date' => '2026-05-04'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['pickup_date']);
});

it('returns 422 when return_date is not after pickup_date', function () {
    $vehicle = Vehicle::factory()->create();

    $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", [
        'pickup_date' => '2026-05-04',
        'return_date' => '2026-05-01',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['return_date']);
});

it('includes vat in total when vat is enabled', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);

    $settings = app(RentalSettings::class);
    $settings->vat_enabled = true;
    $settings->vat_rate = 10;
    $settings->save();

    $response = $this->postJson("/api/v1/public/vehicles/{$vehicle->id}/pricing-preview", pricingPayload($vehicle->id))
        ->assertStatus(200);

    /* base = 300, vat = 30, total = 330 */
    expect((float) $response->json('data.totalAmount'))->toBe(330.0)
        ->and((float) $response->json('data.taxAmount'))->toBe(30.0);
});
