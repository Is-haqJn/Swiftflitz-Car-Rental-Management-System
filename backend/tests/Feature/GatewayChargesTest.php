<?php

use App\Enums\PaymentTransactionStatus;
use App\Events\PaymentStatusUpdated;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('stores gateway_charges and customer_amount from hubtel verify response', function (): void {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-GW-HUBTEL1',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 50.00,
        'gateway_charges' => null,
        'customer_amount' => null,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => [
                'status' => 'Paid',
                'amount' => 50.00,
                'charges' => 1.25,
                'paymentMethod' => 'momo',
            ],
        ], 200),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-GW-HUBTEL1',
            'Status' => 'Success',
            'Amount' => 50.00,
        ],
    ])->assertStatus(200)->assertJsonPath('status', 'ok');

    $fresh = $transaction->fresh();
    expect($fresh->status)->toBe(PaymentTransactionStatus::Paid)
        ->and((float) $fresh->gateway_charges)->toBe(1.25)
        ->and((float) $fresh->customer_amount)->toBe(50.00);

    Event::assertDispatched(PaymentStatusUpdated::class);
});

it('stores gateway_charges and customer_amount from paystack verify response', function (): void {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    /* amount: 9200 kobo = 92.00 GHS; fees: 180 kobo = 1.80 GHS */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-GW-PS1',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 92.00,
        'gateway_charges' => null,
        'customer_amount' => null,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-GW-PS1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 9200,
                'fees' => 180,
                'channel' => 'card',
            ],
        ], 200),
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-GW-PS1']]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200)->assertJsonPath('status', 'ok');

    $fresh = $transaction->fresh();
    expect($fresh->status)->toBe(PaymentTransactionStatus::Paid)
        ->and((float) $fresh->gateway_charges)->toBe(1.80)
        ->and((float) $fresh->customer_amount)->toBe(92.00);

    Event::assertDispatched(PaymentStatusUpdated::class);
});
