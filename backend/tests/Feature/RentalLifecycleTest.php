<?php

use App\Models\Customer;
use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */
function rentalPayload(array $overrides = []): array
{
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    return array_merge([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'pickup_date' => now()->addDay()->format('Y-m-d'),
        'return_date' => now()->addDays(4)->format('Y-m-d'),
        'pickup_time' => '09:00',
        'return_time' => '17:00',
        'source' => 'walk_in',
    ], $overrides);
}

function activeRental(): Rental
{
    return Rental::factory()->active()->create();
}

function pickupPayload(array $overrides = []): array
{
    return array_merge([
        'actual_pickup_date' => now()->format('Y-m-d'),
        'actual_pickup_time' => '09:00',
        'fuel_level' => 'full',
        'mileage' => 10000,
        'condition_notes' => 'No damage noted.',
        'damage_noted' => false,
    ], $overrides);
}

function returnPayload(array $overrides = []): array
{
    return array_merge([
        'actual_return_date' => now()->addDays(3)->format('Y-m-d'),
        'actual_return_time' => '17:00',
        'fuel_level' => 'full',
        'mileage' => 11500,
        'condition_notes' => 'Returned in good condition.',
        'damage_noted' => false,
    ], $overrides);
}

/* Authentication */
it('requires authentication to list rentals', function () {
    $this->getJson('/api/v1/rentals')->assertUnauthorized();
});

it('requires authentication to create a rental', function () {
    $this->postJson('/api/v1/rentals', [])->assertUnauthorized();
});

/* Index */
it('can list rentals', function () {
    Rental::factory()->count(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/rentals')
        ->assertSuccessful()
        ->assertJsonStructure(['data']);
});

/* Store */
it('can create a rental', function () {
    $payload = rentalPayload();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', $payload)
        ->assertCreated();

    $data = $response->json('data');

    expect($data['vehicle_id'])->toBe($payload['vehicle_id'])
        ->and($data['customer_id'])->toBe($payload['customer_id'])
        ->and($data['status'])->toBe('pending')
        ->and($data['payment_status'])->toBe('pending')
        ->and($data['reference'])->toStartWith('RF-');
});

it('computes base cost correctly at creation (rate × days)', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 150.00]);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-06-01',
            'return_date' => '2030-06-06', // 5 days
            'source' => 'walk_in',
        ])
        ->assertCreated();

    $data = $response->json('data');
    expect((float) $data['daily_rate'])->toBe(150.00)
        ->and((int) $data['rental_days'])->toBe(5)
        ->and((float) $data['base_cost'])->toBe(750.00)
        ->and((float) $data['total_cost'])->toBe(750.00);
});

it('applies manual discount when creating a rental', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00]);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-07-01',
            'return_date' => '2030-07-03', // 2 days = 400
            'manual_discount_amount' => 50.00,
            'manual_discount_reason' => 'Loyal customer',
            'source' => 'walk_in',
        ])
        ->assertCreated();

    $data = $response->json('data');
    expect((float) $data['manual_discount_amount'])->toBe(50.00)
        ->and((float) $data['total_cost'])->toBe(350.00);
});

it('skips security deposit when flag is set', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00]);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-08-01',
            'return_date' => '2030-08-03',
            'skip_security_deposit' => true,
            'source' => 'walk_in',
        ])
        ->assertCreated();

    $data = $response->json('data');
    expect($data['skip_security_deposit'])->toBeTrue()
        ->and($data['security_deposit_status'])->toBeNull();
});

it('validates required fields when creating a rental', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['vehicle_id', 'customer_id', 'pickup_date', 'return_date']);
});

it('rejects return_date before pickup_date', function () {
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-06-10',
            'return_date' => '2030-06-05',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['return_date']);
});

/* Show */
it('can show a single rental', function () {
    $rental = Rental::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $rental->id);
});

it('returns 404 for a non-existent rental', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/rentals/non-existent-id')
        ->assertNotFound();
});

/* Update */
it('can update rental notes', function () {
    $rental = Rental::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'admin_notes' => 'Updated by test.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.admin_notes', 'Updated by test.');
});

/* Delete */
it('can soft-delete a pending rental', function () {
    $rental = Rental::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/rentals/{$rental->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('rentals', ['id' => $rental->id]);
});

it('cannot delete an active rental', function () {
    $rental = Rental::factory()->active()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/rentals/{$rental->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rental']);
});

/* Confirm */
it('can confirm a pending rental', function () {
    $rental = Rental::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/confirm")
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'confirmed');
});

it('cannot confirm a non-pending rental', function () {
    $rental = Rental::factory()->active()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/confirm")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* Pickup */
it('can process pickup and marks rental as active', function () {
    $rental = Rental::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", pickupPayload())
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'active');

    $this->assertDatabaseHas('rental_inspections', [
        'rental_id' => $rental->id,
        'type' => 'pickup',
    ]);
});

it('records a late pickup fee when provided', function () {
    $rental = Rental::factory()->confirmed()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", pickupPayload([
            'late_pickup_fee' => 75.00,
        ]))
        ->assertSuccessful();

    expect((float) $response->json('data.late_pickup_fee'))->toBe(75.00);
});

it('cannot pickup a cancelled rental', function () {
    $rental = Rental::factory()->cancelled()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", pickupPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* Return */
it('can process return and marks rental as returned', function () {
    $rental = Rental::factory()->active()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/return", returnPayload())
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'returned');

    $this->assertDatabaseHas('rental_inspections', [
        'rental_id' => $rental->id,
        'type' => 'return',
    ]);
});

it('records damage on return', function () {
    $rental = Rental::factory()->active()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/return", returnPayload([
            'damage_noted' => true,
            'estimated_repair_cost' => 300.00,
        ]))
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['has_damage'])->toBeTrue()
        ->and((float) $data['estimated_repair_cost'])->toBe(300.00)
        ->and($data['damage_settlement_status'])->toBe('pending');
});

it('detects overdue on return and stores overdue fee', function () {
    // Create an overdue rental (return_date in the past)
    $rental = Rental::factory()->overdue()->create([
        'total_cost' => 400.00,
        'amount_paid' => 0.00,
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/return", returnPayload([
            'actual_return_date' => now()->format('Y-m-d'),
        ]))
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['is_overdue'])->toBeTrue()
        ->and($data['settlement_status'])->toBe('pending');
});

it('detects early return and sets settlement_status to pending', function () {
    // Return 2 days before scheduled return_date
    $rental = Rental::factory()->active()->create([
        'return_date' => now()->addDays(2)->format('Y-m-d'),
        'rental_days' => 4,
        'total_cost' => 800.00,
        'daily_rate' => 200.00,
        'amount_paid' => 0.00,
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/return", returnPayload([
            'actual_return_date' => now()->format('Y-m-d'),
        ]))
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['is_early_return'])->toBeTrue()
        ->and($data['settlement_status'])->toBe('pending');
});

it('cannot return a pending rental', function () {
    $rental = Rental::factory()->create(); // pending by default

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/return", returnPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* Approve Return */
it('can approve return and marks rental as completed', function () {
    $rental = Rental::factory()->returned()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'completed');
});

it('blocks approve-return when settlement is pending', function () {
    $rental = Rental::factory()->returned()->create([
        'settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['settlement_status']);
});

it('blocks approve-return when damage settlement is pending', function () {
    $rental = Rental::factory()->returned()->create([
        'damage_settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['damage_settlement_status']);
});

/* Cancellation */
it('can cancel a pending rental', function () {
    $rental = Rental::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/cancel", [
            'reason' => 'Customer changed plans.',
            'cancelled_by_type' => 'customer',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'cancelled');

    $this->assertDatabaseHas('rentals', [
        'id' => $rental->id,
        'status' => 'cancelled',
    ]);
});

it('can cancel a confirmed rental', function () {
    $rental = Rental::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/cancel", [
            'reason' => 'Vehicle unavailable.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'cancelled');
});

it('cannot cancel a completed rental', function () {
    $rental = Rental::factory()->completed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/cancel")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('cannot cancel an already cancelled rental', function () {
    $rental = Rental::factory()->cancelled()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/cancel")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* Settlement */
it('can settle a rental balance and marks it settled', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 500.00,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle", [
            'amount' => 500.00,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.settlement_status', 'settled');
});

it('partial payment keeps settlement_status pending', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 500.00,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle", [
            'amount' => 200.00,
        ])
        ->assertSuccessful();

    expect($response->json('data.settlement_status'))->toBe('pending')
        ->and((float) $response->json('data.amount_paid'))->toBe(200.00);
});

it('amount_due is never negative', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 300.00,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
    ]);

    // Overpay
    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle", [
            'amount' => 500.00, // more than owed
        ])
        ->assertSuccessful();

    expect((float) $response->json('data.amount_due'))->toBeGreaterThanOrEqual(0.0);
});

it('amount_due for a cancelled rental equals cancellation_amount_owed not total_cost minus amount_paid', function () {
    $rental = Rental::factory()->cancelled()->create([
        'total_cost' => 2940.00,
        'amount_paid' => 1500.00,
        'overdue_fee' => 300.00,
        'cancellation_amount_owed' => 1440.00,
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertSuccessful();

    expect((float) $response->json('data.amount_due'))->toBe(1440.0);
});

/* Damage Settlement */
it('can settle damage as settled', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'estimated_repair_cost' => 400.00,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'settled',
            'actual_repair_cost' => 380.00,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.damage_settlement_status', 'settled');
});

it('can settle damage as forfeited', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'estimated_repair_cost' => 400.00,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'forfeited',
            'actual_repair_cost' => 0.00,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.damage_settlement_status', 'forfeited');
});

/* Deposit Refund */
it('can refund security deposit', function () {
    $rental = Rental::factory()->returned()->withDeposit(200.00)->create([
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/refund-deposit")
        ->assertSuccessful()
        ->assertJsonPath('data.security_deposit_status', 'refunded');

    $this->assertDatabaseHas('rentals', [
        'id' => $rental->id,
        'security_deposit_status' => 'refunded',
        'deposit_refunded' => 200.00,
    ]);
});

/* Waive Overdue */
it('can waive overdue fee', function () {
    $rental = Rental::factory()->returned()->create([
        'overdue_fee' => 150.00,
        'is_overdue' => true,
        'settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/waive-overdue", [
            'reason' => 'One-time goodwill waiver.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.overdue_waived', true);

    $this->assertDatabaseHas('rentals', [
        'id' => $rental->id,
        'overdue_waived' => true,
        'overdue_fee' => 0,
    ]);
});

/* Switch Vehicle */
it('can switch vehicle on a confirmed rental', function () {
    $rental = Rental::factory()->confirmed()->create([
        'pickup_date' => '2030-09-01',
        'return_date' => '2030-09-05',
    ]);
    $newVehicle = Vehicle::factory()->create(['daily_rate' => 250.00]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/switch-vehicle", [
            'vehicle_id' => $newVehicle->id,
            'reason' => 'Original vehicle in maintenance.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.vehicle_id', $newVehicle->id);
});

it('cannot switch vehicle after pickup', function () {
    $rental = Rental::factory()->active()->create();
    $newVehicle = Vehicle::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/switch-vehicle", [
            'vehicle_id' => $newVehicle->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

/* Pricing Preview */
it('can preview pricing for a rental', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00]);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/pricing/preview', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-10-01',
            'return_date' => '2030-10-04', // 3 days
        ])
        ->assertSuccessful()
        ->assertJsonStructure(['data' => [
            'rentalDays',
            'dailyRate',
            'base',
            'subtotal',
            'totalAmount',
        ]]);
});

it('pricing preview returns correct base cost', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 120.00]);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/pricing/preview', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-11-01',
            'return_date' => '2030-11-06', // 5 days
        ])
        ->assertSuccessful();

    expect((int) $response->json('data.rentalDays'))->toBe(5)
        ->and((float) $response->json('data.dailyRate'))->toBe(120.00)
        ->and((float) $response->json('data.base'))->toBe(600.00);
});

/* amount_due Computation */
it('amount_due reflects overdue fee added to total cost', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 400.00,
        'overdue_fee' => 60.00,
        'is_overdue' => true,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertSuccessful();

    // amount_due = total_cost + overdue_fee - amount_paid = 400 + 60 - 0 = 460
    expect((float) $response->json('data.amount_due'))->toBe(460.00);
});

it('amount_due subtracts early return refund', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 800.00,
        'early_return_refund' => 200.00,
        'is_early_return' => true,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertSuccessful();

    // amount_due = 800 - 200 - 0 = 600
    expect((float) $response->json('data.amount_due'))->toBe(600.00);
});

/* Full Happy Path */
it('completes a full rental lifecycle: create → confirm → pickup → return → settle → approve', function () {
    $admin = adminUser();
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    // 1. Create
    $createResponse = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-12-01',
            'return_date' => '2030-12-04', // 3 days = 600
            'source' => 'walk_in',
        ])
        ->assertCreated();

    $id = $createResponse->json('data.id');
    expect($createResponse->json('data.status'))->toBe('pending')
        ->and((float) $createResponse->json('data.total_cost'))->toBe(600.00);

    // 2. Confirm
    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/rentals/{$id}/confirm")
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'confirmed');

    // 3. Pickup
    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/rentals/{$id}/pickup", [
            'actual_pickup_date' => '2030-12-01',
            'actual_pickup_time' => '09:00',
            'fuel_level' => 'full',
            'mileage' => 50000,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'active');

    // 4. Return (on-time, no damage)
    $returnResp = $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/rentals/{$id}/return", [
            'actual_return_date' => '2030-12-04',
            'actual_return_time' => '17:00',
            'fuel_level' => 'full',
            'mileage' => 51200,
            'damage_noted' => false,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'returned');

    // On-time return with no damage - no pending settlement unless amount_due > 0
    $returnData = $returnResp->json('data');
    expect($returnData['is_overdue'])->toBeFalse()
        ->and($returnData['has_damage'])->toBeFalse();

    // 5. Settle if settlement pending
    if ($returnData['settlement_status'] === 'pending') {
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/rentals/{$id}/settle", [
                'amount' => (float) $returnData['amount_due'],
            ])
            ->assertSuccessful()
            ->assertJsonPath('data.settlement_status', 'settled');
    }

    // 6. Approve return → completed
    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/rentals/{$id}/approve-return")
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'completed');
});
