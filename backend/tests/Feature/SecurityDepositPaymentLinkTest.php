<?php

use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalPaymentStatus;
use App\Enums\TransactionType;
use App\Events\PaymentStatusUpdated;
use App\Mail\BookingPaymentLinkMail;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('sends security deposit payment link for confirmed rental', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'deposit@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => 'confirmed',
        'security_deposit_amount' => 500.00,
        'deposit_waived' => false,
        'skip_security_deposit' => false,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-security-deposit-payment-link")
        ->assertSuccessful()
        ->assertJsonPath('message', 'Security deposit payment link sent to customer.');

    Mail::assertQueued(BookingPaymentLinkMail::class, function (BookingPaymentLinkMail $mail) use ($rental) {
        return $mail->amountDue === 500.0
            && str_contains($mail->paymentUrl, '/payment/rental/' . $rental->id)
            && str_contains($mail->paymentUrl, 'purpose=deposit');
    });
});

it('rejects when deposit amount is zero', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'nodeposit@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => 'confirmed',
        'security_deposit_amount' => 0.00,
        'deposit_waived' => false,
        'skip_security_deposit' => false,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-security-deposit-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('rejects when deposit is waived', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'waived@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => 'confirmed',
        'security_deposit_amount' => 500.00,
        'deposit_waived' => true,
        'skip_security_deposit' => false,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-security-deposit-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('rejects when rental status is not confirmed or active', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'pending@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => 'pending',
        'security_deposit_amount' => 500.00,
        'deposit_waived' => false,
        'skip_security_deposit' => false,
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/rentals/{$rental->id}/send-security-deposit-payment-link")
        ->assertUnprocessable();

    Mail::assertNothingQueued();
});

it('resolvePayableAmount returns security_deposit_amount for purpose=deposit', function () {
    $customer = Customer::factory()->create();
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'security_deposit_amount' => 400.00,
        'total_cost' => 1000.00,
        'amount_paid' => 0.00,
    ]);

    $paymentService = app(\App\Services\PaymentService::class);
    $amount = $paymentService->resolvePayableAmount('rental', $rental->id, 'deposit');

    expect($amount)->toBe(400.0);
});

it('MarkTransactableAsPaid sets security_deposit_status to held for purpose=deposit', function () {
    $customer = Customer::factory()->create();
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'security_deposit_amount' => 300.00,
        'total_cost' => 1000.00,
        'amount_paid' => 0.00,
        'payment_status' => RentalPaymentStatus::Pending,
        'security_deposit_status' => 'pending',
        'deposit_paid' => 0.00,
    ]);

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 300.00,
        'status' => PaymentTransactionStatus::Paid,
        'metadata' => ['purpose' => 'deposit'],
    ]);

    event(new PaymentStatusUpdated($transaction));

    $rental->refresh();
    $transaction->refresh();

    expect($rental->security_deposit_status)->toBe('held')
        ->and((float) $rental->deposit_paid)->toBe(300.0)
        ->and((float) $rental->amount_paid)->toBe(0.0)
        ->and($transaction->type)->toBe(TransactionType::SecurityDeposit);
});
