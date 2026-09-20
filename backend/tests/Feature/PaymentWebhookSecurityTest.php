<?php

use App\DTOs\PaymentInitiateData;
use App\Enums\PaymentTransactionStatus;
use App\Events\PaymentStatusUpdated;
use App\Models\Branch;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Services\PaymentService;
use App\Settings\GeneralSettings;
use App\Settings\PaymentSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

/* Helpers - use a distinct name to avoid collision with PaymentTest.php seedPaymentConfig() */

function seedPaymentSecurityConfig(array $overrides = []): void
{
    $settings = app(PaymentSettings::class);

    $defaults = [
        'payment_provider' => 'paystack',
        'paystack_public_key' => 'pk_test_public',
        'paystack_secret_key' => 'sk_test_secret',
        'stripe_public_key' => 'pk_stripe_test',
        'stripe_secret_key' => 'sk_stripe_secret',
        'hubtel_client_id' => 'hubtel_client',
        'hubtel_client_secret' => 'hubtel_secret',
        'enable_online_payments' => true,
        'enable_paystack' => true,
        'enable_stripe' => false,
        'enable_hubtel' => true,
        'payment_currency' => 'GHS',
        'paystack_logo_url' => null,
        'stripe_logo_url' => null,
        'hubtel_logo_url' => null,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* Webhook Logging Tests */

it('logs warning when hubtel webhook has invalid response code', function () {
    seedPaymentSecurityConfig(['payment_provider' => 'hubtel']);
    Log::spy();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUB-INVALID',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
    ]);

    /* ResponseCode is not '0000' - invalid webhook */
    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '9999',
        'Status' => 'Failed',
        'Data' => ['ClientReference' => 'TXN-HUB-INVALID'],
    ])->assertStatus(200);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn ($msg) => str_contains($msg, 'Payment webhook rejected'));
});

it('logs warning when paystack webhook has invalid hmac signature', function () {
    seedPaymentSecurityConfig();
    Log::spy();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-BADSIG',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-PS-BADSIG']]);

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => 'completely-invalid-signature',
        'Content-Type' => 'application/json',
    ])->assertStatus(200);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn ($msg) => str_contains($msg, 'Payment webhook rejected'));
});

it('logs info when hubtel webhook successfully processes payment', function () {
    seedPaymentSecurityConfig(['payment_provider' => 'hubtel']);
    Log::spy();
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUB-OK',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 50.00,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => [
                'status' => 'Paid',
                'amount' => 50.00,
                'paymentMethod' => 'mobilemoney',
            ],
        ], 200),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUB-OK',
            'Amount' => 50.00,
        ],
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);

    Log::shouldHaveReceived('info')
        ->once()
        ->withArgs(fn ($msg) => str_contains($msg, 'Payment webhook processed'));
});

/* Amount Mismatch - Paystack */

it('flags paystack payment as under_review when amount mismatches by more than 0.01', function () {
    seedPaymentSecurityConfig();

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-MISMATCH',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 100.00,
        'gateway_amount' => null,
    ]);

    /* Paystack verify returns amount in kobo: 5000 = GHS 50.00 - big mismatch vs 100.00 */
    Http::fake([
        'api.paystack.co/transaction/verify/TXN-PS-MISMATCH' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 5000,
            ],
        ], 200),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'TXN-PS-MISMATCH', 'status' => 'success', 'amount' => 5000],
    ]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::UnderReview);
});

it('does not flag paystack payment when amount matches within 0.01 tolerance', function () {
    seedPaymentSecurityConfig();

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-MATCH',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 100.00,
        'gateway_amount' => null,
    ]);

    /* Paystack verify returns 10000 kobo = 100.00 GHS - exact match */
    Http::fake([
        'api.paystack.co/transaction/verify/TXN-PS-MATCH' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
            ],
        ], 200),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'TXN-PS-MATCH', 'status' => 'success', 'amount' => 10000],
    ]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
});

/* Exchange Rate Bounds Validation */

it('throws when exchange rate is zero', function () {
    seedPaymentSecurityConfig(['payment_provider' => 'hubtel']);

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'exchange_rate' => 0.0,
        'currency_symbol' => '₦',
    ]);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 100.00,
        'amount_paid' => 0.00,
    ]);

    $service = app(PaymentService::class);

    $data = new PaymentInitiateData(
        amount: 100.00,
        currency: 'NGN',
        payerEmail: 'test@example.com',
        payerPhone: '0200000001',
        payerName: 'Test User',
        transactableType: 'rental',
        transactableId: $rental->id,
        callbackUrl: null,
        returnUrl: null,
        metadata: [],
    );

    Http::fake([
        'payproxyapi.hubtel.com/*' => Http::response([
            'data' => ['checkoutUrl' => 'https://hubtel.com/pay/test', 'checkoutId' => 'HUB-123'],
        ], 200),
    ]);

    expect(fn () => $service->initiate($data))
        ->toThrow(InvalidArgumentException::class, 'out of valid bounds');
});

it('throws when exchange rate exceeds 100000', function () {
    seedPaymentSecurityConfig(['payment_provider' => 'hubtel']);

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'exchange_rate' => 100001.0,
        'currency_symbol' => '₦',
    ]);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 100.00,
        'amount_paid' => 0.00,
    ]);

    $service = app(PaymentService::class);

    $data = new PaymentInitiateData(
        amount: 100.00,
        currency: 'NGN',
        payerEmail: 'test@example.com',
        payerPhone: '0200000001',
        payerName: 'Test User',
        transactableType: 'rental',
        transactableId: $rental->id,
        callbackUrl: null,
        returnUrl: null,
        metadata: [],
    );

    Http::fake([
        'payproxyapi.hubtel.com/*' => Http::response([
            'data' => ['checkoutUrl' => 'https://hubtel.com/pay/test', 'checkoutId' => 'HUB-456'],
        ], 200),
    ]);

    expect(fn () => $service->initiate($data))
        ->toThrow(InvalidArgumentException::class, 'out of valid bounds');
});

it('does not throw when exchange rate is within valid range', function () {
    seedPaymentSecurityConfig(['payment_provider' => 'hubtel']);

    $generalSettings = app(GeneralSettings::class);
    $generalSettings->currency_symbol = '₵';
    $generalSettings->save();

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'exchange_rate' => 0.085,
        'currency_symbol' => '₦',
    ]);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 1000.00,
        'amount_paid' => 0.00,
    ]);

    $service = app(PaymentService::class);

    $data = new PaymentInitiateData(
        amount: 1000.00,
        currency: 'NGN',
        payerEmail: 'test@example.com',
        payerPhone: '0200000001',
        payerName: 'Test User',
        transactableType: 'rental',
        transactableId: $rental->id,
        callbackUrl: null,
        returnUrl: null,
        metadata: [],
    );

    Http::fake([
        'payproxyapi.hubtel.com/*' => Http::response([
            'data' => ['checkoutUrl' => 'https://hubtel.com/pay/test', 'checkoutId' => 'HUB-789'],
        ], 200),
    ]);

    /* Should not throw - rate 0.085 is within (0, 100000] */
    $result = $service->initiate($data);

    expect($result->success)->toBeTrue();

    /* Converted amount: 1000 * 0.085 = 85.00 GHS */
    $tx = PaymentTransaction::first();
    expect((float) $tx->gateway_amount)->toBe(85.0);
});
