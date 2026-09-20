<?php

use App\Enums\TransactionType;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Feature 1: Initial payment on create */

it('records initial payment transaction when rental created with upfront payment', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'initial_payment' => 300.00,
            'source' => 'walk_in',
        ])
        ->assertCreated();

    expect(PaymentTransaction::where('type', TransactionType::InitialPayment->value)
        ->where('amount', 300.00)
        ->where('status', 'paid')
        ->exists()
    )->toBeTrue();
});

it('does not record payment transaction when rental created with no upfront payment', function () {
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'initial_payment' => 0,
            'source' => 'walk_in',
        ])
        ->assertCreated();

    expect(PaymentTransaction::count())->toBe(0);
});

/* Feature 1: Security deposit on collectDeposit */

it('records security deposit transaction when collectDeposit is called', function () {
    $rental = Rental::factory()->create([
        'security_deposit_amount' => 200.00,
        'security_deposit_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/collect-deposit")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::SecurityDeposit->value)
        ->where('amount', 200.00)
        ->where('status', 'paid')
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

/* Feature 1: Security deposit at pickup */

it('records security deposit transaction when deposit collected at pickup', function () {
    $rental = Rental::factory()->confirmed()->create([
        'security_deposit_amount' => 300.00,
        'security_deposit_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/pickup", [
            'actual_pickup_date' => now()->format('Y-m-d'),
            'actual_pickup_time' => '09:00',
            'fuel_level' => 'full',
            'mileage' => 10000,
            'condition_notes' => 'Good condition.',
            'damage_noted' => false,
            'collect_deposit' => true,
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::SecurityDeposit->value)
        ->where('amount', 300.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

/* Feature 1: settleWithDeposit */

it('records security deposit transaction when settleWithDeposit applies deposit to balance', function () {
    $rental = Rental::factory()->returned()->create([
        'total_cost' => 500.00,
        'amount_paid' => 0.00,
        'settlement_status' => 'pending',
        'security_deposit_amount' => 200.00,
        'security_deposit_status' => 'held',
        'deposit_paid' => 200.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-with-deposit")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::SecurityDeposit->value)
        ->where('amount', 200.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

/* Feature 1: settleRefund - approved */

it('records Refund transaction when settleRefund approved', function () {
    $rental = Rental::factory()->cancelled()->create([
        'refund_amount' => 150.00,
        'refund_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-refund", [
            'action' => 'approved',
            'refund_amount' => 150.00,
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::Refund->value)
        ->where('amount', 150.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('does not record transaction when refund is waived', function () {
    $rental = Rental::factory()->cancelled()->create([
        'refund_amount' => 150.00,
        'refund_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-refund", [
            'action' => 'waived',
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::count())->toBe(0);
});

/* Feature 1: settleRefund - mark_received */

it('records CancellationFee transaction when settleRefund mark_received', function () {
    $rental = Rental::factory()->cancelled()->create([
        'refund_status' => null,
        'cancellation_amount_owed' => 100.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-refund", [
            'action' => 'mark_received',
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::CancellationFee->value)
        ->where('amount', 100.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('does not record transaction when cancellation debt is waived', function () {
    $rental = Rental::factory()->cancelled()->create([
        'refund_status' => null,
        'cancellation_amount_owed' => 100.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-refund", [
            'action' => 'waive_debt',
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::count())->toBe(0);
});

/* Feature 1: settleRefund - deduct_deposit */

it('records CancellationFee transaction when settleRefund deduct_deposit', function () {
    $rental = Rental::factory()->cancelled()->create([
        'refund_status' => null,
        'cancellation_amount_owed' => 80.00,
        'security_deposit_amount' => 200.00,
        'security_deposit_status' => 'held',
        'deposit_paid' => 200.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-refund", [
            'action' => 'deduct_deposit',
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::CancellationFee->value)
        ->where('amount', 80.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

/* Feature 1: refundDeposit */

it('records DepositRefund transaction when refundDeposit is called', function () {
    $rental = Rental::factory()->returned()->withDeposit(200.00)->create([
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/refund-deposit")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::DepositRefund->value)
        ->where('amount', 200.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('does not record DepositRefund when net refundable is zero', function () {
    $rental = Rental::factory()->returned()->create([
        'settlement_status' => 'settled',
        'security_deposit_amount' => 200.00,
        'security_deposit_status' => 'held',
        'deposit_paid' => 200.00,
        'deposit_applied_to_balance' => 200.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/refund-deposit")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::DepositRefund->value)->exists())->toBeFalse();
});

/* Feature 1: approveReturn auto deposit refund */

it('records DepositRefund transaction when approveReturn auto-refunds held deposit', function () {
    $rental = Rental::factory()->returned()->withDeposit(200.00)->create([
        'settlement_status' => 'settled',
        'damage_settlement_status' => null,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/approve-return")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::DepositRefund->value)
        ->where('amount', 200.00)
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

/* Feature 2: Damage settlement transaction recording */

it('records a pending RepairCost transaction when repair cost is estimated', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/rentals/{$rental->id}/record-repair-cost", [
            'estimated_repair_cost' => 500.00,
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::RepairCost->value)
        ->where('amount', 500.00)
        ->where('status', 'pending')
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('updates RepairCost to paid when settleDamage resolves prior estimate', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
        'estimated_repair_cost' => 500.00,
    ]);

    PaymentTransaction::create([
        'reference' => 'DMG-TESTPENDING',
        'provider' => 'manual',
        'type' => TransactionType::RepairCost->value,
        'amount' => 500.00,
        'currency' => 'GHS',
        'status' => 'pending',
        'payer_name' => 'Test',
        'payer_email' => 'test@example.com',
        'payer_phone' => '',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'settled',
            'actual_repair_cost' => 450.00,
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::RepairCost->value)
        ->where('amount', 450.00)
        ->where('status', 'paid')
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('creates a DamageCharge transaction when settleDamage has no prior estimate', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/settle-damage", [
            'outcome' => 'settled',
            'actual_repair_cost' => 300.00,
        ])
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::DamageCharge->value)
        ->where('amount', 300.00)
        ->where('status', 'paid')
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});

it('creates a DamageCharge transaction when collecting damage balance', function () {
    $rental = Rental::factory()->returned()->create([
        'has_damage' => true,
        'damage_settlement_status' => 'pending',
        'settlement_status' => 'settled',
        'damage_balance_due' => 200.00,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/collect-damage-balance")
        ->assertSuccessful();

    expect(PaymentTransaction::where('type', TransactionType::DamageCharge->value)
        ->where('amount', 200.00)
        ->where('status', 'paid')
        ->where('transactable_type', 'rental')
        ->where('transactable_id', $rental->id)
        ->exists()
    )->toBeTrue();
});
