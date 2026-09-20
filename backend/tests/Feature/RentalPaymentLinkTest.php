<?php

use App\Mail\BookingPaymentLinkMail;
use App\Mail\PaymentLinkMail;
use App\Models\Customer;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('sends payment link email when rental has outstanding balance', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 500.00,
        'amount_paid' => 200.00,
        'payment_status' => 'partially_paid',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-payment-link")
        ->assertSuccessful()
        ->assertJsonPath('message', 'Payment link sent to customer.');

    Mail::assertQueued(PaymentLinkMail::class, function (PaymentLinkMail $mail) use ($rental, $customer) {
        return $mail->rental->id === $rental->id
            && $mail->amountDue === 300.00
            && str_contains($mail->paymentUrl, '/payment/rental/' . $rental->id)
            && str_contains($mail->paymentUrl, 'email=' . urlencode($customer->email))
            && str_contains($mail->paymentUrl, 'booking_ref=' . urlencode($rental->reference));
    });
});

it('returns validation error when rental is fully paid', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'paid@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 400.00,
        'amount_paid' => 400.00,
        'payment_status' => 'paid',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('returns validation error when customer has no email', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => '']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 400.00,
        'amount_paid' => 100.00,
        'payment_status' => 'partially_paid',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('requires authentication to send payment link', function () {
    $rental = Rental::factory()->create();

    $this->postJson("/api/v1/rentals/{$rental->id}/send-payment-link")
        ->assertUnauthorized();
});

/* Damage payment link */

it('sends damage payment link with purpose=damage in url', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'damage@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'has_damage' => true,
        'estimated_repair_cost' => 250.00,
        'damage_balance_due' => null,
        'damage_settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-damage-payment-link")
        ->assertSuccessful();

    Mail::assertQueued(BookingPaymentLinkMail::class, function (BookingPaymentLinkMail $mail) use ($rental) {
        return $mail->amountDue === 250.0
            && str_contains($mail->paymentUrl, '/payment/rental/' . $rental->id)
            && str_contains($mail->paymentUrl, 'purpose=damage');
    });
});

it('sends damage payment link using damage_balance_due when set', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'damage2@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'has_damage' => true,
        'estimated_repair_cost' => 300.00,
        'damage_balance_due' => 150.00,
        'damage_settlement_status' => 'pending',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-damage-payment-link")
        ->assertSuccessful();

    Mail::assertQueued(BookingPaymentLinkMail::class, function (BookingPaymentLinkMail $mail) {
        /* damage_balance_due takes priority */
        return $mail->amountDue === 150.0;
    });
});

it('returns error when no damage amount exists', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'nodamage@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 400.00,
        'amount_paid' => 400.00,
        'has_damage' => false,
        'estimated_repair_cost' => null,
        'damage_balance_due' => null,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-damage-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('damage payment link url does not include amount that can be tampered', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'secure@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'has_damage' => true,
        'estimated_repair_cost' => 250.00,
        'damage_balance_due' => null,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-damage-payment-link")
        ->assertSuccessful();

    Mail::assertQueued(BookingPaymentLinkMail::class, function (BookingPaymentLinkMail $mail) {
        /* Amount must NOT be in the URL */
        return ! str_contains($mail->paymentUrl, 'amount=');
    });
});
