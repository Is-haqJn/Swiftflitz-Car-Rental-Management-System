<?php

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalStatus;
use App\Mail\PaymentLinkMail;
use App\Models\Customer;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\Vehicle;
use App\Services\Contracts\RentalServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

/* resolvePayableAmount - via GET /api/v1/payments/payable-amount */

it('resolvePayableAmount includes overdue_fee for overdue rentals', function () {
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Overdue->value,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
        'total_cost' => 1600.00,
        'amount_paid' => 800.00,
        'overdue_fee' => 200.00,
        'damage_balance_due' => null,
        'estimated_repair_cost' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    expect((float) $response->json('data.amount'))->toBe(1000.0);
});

it('resolvePayableAmount returns cancellation_amount_owed for cancelled rentals', function () {
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Cancelled->value,
        'payment_status' => RentalPaymentStatus::Pending->value,
        'total_cost' => 640.00,
        'amount_paid' => 0.00,
        'cancellation_amount_owed' => 690.00,
        'overdue_fee' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    expect((float) $response->json('data.amount'))->toBe(690.0);
});

it('resolvePayableAmount returns zero when cancelled rental has no amount owed', function () {
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Cancelled->value,
        'payment_status' => RentalPaymentStatus::Refunded->value,
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'cancellation_amount_owed' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    expect((float) $response->json('data.amount'))->toBe(0.0);
});

it('resolvePayableAmount uses standard formula for active rentals', function () {
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Active->value,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
        'total_cost' => 2200.00,
        'amount_paid' => 1000.00,
        'overdue_fee' => null,
        'damage_balance_due' => null,
        'estimated_repair_cost' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    expect((float) $response->json('data.amount'))->toBe(1200.0);
});

it('resolvePayableAmount excludes damage_balance_due from main rental formula', function () {
    /*
     * Damage has its own payment link (purpose=damage).
     * The main link covers the rental balance only.
     */
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Active->value,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
        'total_cost' => 2000.00,
        'amount_paid' => 1000.00,
        'overdue_fee' => 0.00,
        'damage_balance_due' => 300.00,
        'estimated_repair_cost' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    /* 2000 - 1000 = 1000 (damage excluded) */
    expect((float) $response->json('data.amount'))->toBe(1000.0);
});

it('resolvePayableAmount includes late_pickup_fee in rental formula', function () {
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Active->value,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
        'total_cost' => 1800.00,
        'amount_paid' => 1000.00,
        'overdue_fee' => null,
        'late_pickup_fee' => 150.00,
        'damage_balance_due' => null,
        'estimated_repair_cost' => null,
    ]);

    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]))->assertOk();

    /* 1800 - 1000 + 150 = 950 */
    expect((float) $response->json('data.amount'))->toBe(950.0);
});

/* getByToken - payment_pending redirect cases */

it('getByToken returns 409 with payment_pending type when quote converted but rental unpaid', function () {
    $customer = Customer::factory()->create();
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Confirmed->value,
        'payment_status' => RentalPaymentStatus::Pending->value,
        'total_cost' => 600.00,
        'amount_paid' => 0.00,
    ]);

    $token = bin2hex(random_bytes(16));
    $quote = QuoteRequest::factory()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'status' => 'converted',
        'converted_rental_id' => $rental->id,
        'quote_token' => $token,
        'token_expires_at' => now()->addHours(48),
    ]);

    $this->getJson("/api/v1/public/quotes/{$quote->quote_token}")
        ->assertStatus(409)
        ->assertJsonPath('type', 'payment_pending')
        ->assertJsonPath('rental_id', $rental->id);
});

it('getByToken returns 409 without payment_pending when quote converted and rental paid', function () {
    $customer = Customer::factory()->create();
    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'status' => RentalStatus::Confirmed->value,
        'payment_status' => RentalPaymentStatus::Paid->value,
        'total_cost' => 600.00,
        'amount_paid' => 600.00,
    ]);

    $token = bin2hex(random_bytes(16));
    $quote = QuoteRequest::factory()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'status' => 'converted',
        'converted_rental_id' => $rental->id,
        'quote_token' => $token,
        'token_expires_at' => now()->addHours(48),
    ]);

    $this->getJson("/api/v1/public/quotes/{$quote->quote_token}")
        ->assertStatus(409)
        ->assertJsonMissing(['type' => 'payment_pending']);
});

/* sendPaymentLink - overdue_fee included in email amount */

it('sendPaymentLink queues email with amount including overdue_fee', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'overdue@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Overdue->value,
        'payment_status' => RentalPaymentStatus::PartiallyPaid->value,
        'total_cost' => 1600.00,
        'amount_paid' => 850.00,
        'overdue_fee' => 100.00,
        'damage_balance_due' => null,
        'estimated_repair_cost' => null,
    ]);

    /* 1600 - 850 + 100 = 850 */
    app(RentalServiceInterface::class)->sendPaymentLink($rental);

    Mail::assertQueued(PaymentLinkMail::class, function ($mail) {
        return (float) $mail->amountDue === 850.0;
    });
});

it('sendPaymentLink throws when overdue rental is effectively paid after overdue_fee', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'paid@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Active->value,
        'payment_status' => RentalPaymentStatus::Paid->value,
        'total_cost' => 1600.00,
        'amount_paid' => 1600.00,
        'overdue_fee' => null,
    ]);

    expect(fn () => app(RentalServiceInterface::class)->sendPaymentLink($rental))
        ->toThrow(\Illuminate\Validation\ValidationException::class);

    Mail::assertNothingQueued();
});
