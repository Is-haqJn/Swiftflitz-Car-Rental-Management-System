<?php

use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('sets payment_status to paid when total_cost is zero after full discount', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    /* A 100% manual discount on a 1-day rental (100.00) makes total = 0 */
    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-09-01',
            'return_date' => '2030-09-02', // 1 day = 100.00
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'source' => 'walk_in',
            'skip_security_deposit' => true,
            'manual_discount_amount' => 100.00,
            'manual_discount_reason' => 'Complimentary rental',
        ])
        ->assertCreated();

    $data = $response->json('data');

    expect((float) $data['total_cost'])->toBe(0.0)
        ->and($data['payment_status'])->toBe('paid');

    /* No payment transaction should be recorded for a zero-cost rental */
    expect(PaymentTransaction::count())->toBe(0);
});

it('sets payment_status to pending when total_cost is positive and no initial payment', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 100.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => '2030-09-01',
            'return_date' => '2030-09-02',
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'source' => 'walk_in',
            'skip_security_deposit' => true,
        ])
        ->assertCreated();

    $data = $response->json('data');

    expect((float) $data['total_cost'])->toBeGreaterThan(0.0)
        ->and($data['payment_status'])->toBe('pending');
});
