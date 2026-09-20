<?php

use App\Enums\PaymentTransactionStatus;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use App\Services\Payment\Adapters\HubtelAdapter;
use App\Services\Payment\Adapters\PaystackAdapter;
use App\Settings\PaymentSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/* Seed minimal payment settings so adapters resolve */
function seedCardTestPaymentConfig(): void
{
    $settings = app(PaymentSettings::class);
    $settings->payment_provider = 'paystack';
    $settings->paystack_public_key = 'pk_test_public';
    $settings->paystack_secret_key = 'sk_test_secret';
    $settings->hubtel_client_id = 'hubtel_client';
    $settings->hubtel_client_secret = 'hubtel_secret';
    $settings->hubtel_merchant_account_number = 'HM-123';
    $settings->enable_online_payments = true;
    $settings->enable_paystack = true;
    $settings->enable_hubtel = true;
    $settings->payment_currency = 'GHS';
    $settings->save();
}

/* PaystackAdapter::verify - card channel */

it('extracts card bin, last4 and card_type from paystack verify response', function () {
    seedCardTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-CARD1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 15000,
                'channel' => 'card',
                'customer' => ['phone' => '0244000001'],
                'authorization' => [
                    'bin' => '408408',
                    'last4' => '4081',
                    'card_type' => 'visa',
                    'mobile_money_number' => null,
                ],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);
    $result = $adapter->verify('TXN-CARD1');

    expect($result->success)->toBeTrue();
    expect($result->channel)->toBe('card');
    expect($result->cardBin)->toBe('408408');
    expect($result->cardLast4)->toBe('4081');
    expect($result->cardType)->toBe('visa');
    expect($result->paymentPhone)->toBe('0244000001');
});

it('extracts payment phone from paystack momo verify response', function () {
    seedCardTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MOMO1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 15000,
                'channel' => 'mobile_money',
                'customer' => ['phone' => '0244000002'],
                'authorization' => [
                    'mobile_money_number' => '0551234567',
                    'bin' => null,
                    'last4' => null,
                    'card_type' => null,
                ],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);
    $result = $adapter->verify('TXN-MOMO1');

    expect($result->paymentPhone)->toBe('0551234567');
    expect($result->cardBin)->toBeNull();
    expect($result->cardLast4)->toBeNull();
});

it('falls back to customer phone when momo_number is absent in paystack verify', function () {
    seedCardTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-BANK1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 15000,
                'channel' => 'bank_transfer',
                'customer' => ['phone' => '0244000003'],
                'authorization' => [],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);
    $result = $adapter->verify('TXN-BANK1');

    expect($result->paymentPhone)->toBe('0244000003');
    expect($result->cardBin)->toBeNull();
});

/* Paystack webhook - card info stored on transaction */

it('stores card info on transaction when paystack webhook has authorization data', function () {
    seedCardTestPaymentConfig();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-WHCARD1',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 150.00,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-WHCARD1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 15000,
                'channel' => 'card',
                'customer' => ['phone' => '0244000004'],
                'authorization' => [
                    'bin' => '512345',
                    'last4' => '6789',
                    'card_type' => 'mastercard',
                ],
            ],
        ], 200),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => [
            'reference' => 'TXN-WHCARD1',
            'status' => 'success',
            'amount' => 15000,
            'channel' => 'card',
            'customer' => ['phone' => '0244000004'],
            'authorization' => [
                'bin' => '512345',
                'last4' => '6789',
                'card_type' => 'mastercard',
            ],
        ],
    ]);

    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    $tx = PaymentTransaction::where('reference', 'TXN-WHCARD1')->first();
    expect($tx->card_bin)->toBe('512345');
    expect($tx->card_last4)->toBe('6789');
    expect($tx->card_type)->toBe('mastercard');
    expect($tx->payment_phone)->toBe('0244000004');
});

/* HubtelAdapter::verify - card channel phone */

it('extracts customer phone from hubtel verify response for card channel', function () {
    seedCardTestPaymentConfig();

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => [
                'status' => 'Paid',
                'amount' => 150.00,
                'paymentMethod' => 'card',
                'CustomerPhoneNumber' => '0244000005',
            ],
        ], 200),
    ]);

    $adapter = app(HubtelAdapter::class);
    $result = $adapter->verify('TXN-HUB-CARD1');

    expect($result->channel)->toBe('card');
    expect($result->paymentPhone)->toBe('0244000005');
    expect($result->cardBin)->toBeNull();
    expect($result->cardLast4)->toBeNull();
});

it('extracts momo phone from hubtel verify response for momo channel', function () {
    seedCardTestPaymentConfig();

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => [
                'status' => 'Paid',
                'amount' => 150.00,
                'paymentMethod' => 'mobilemoney',
                'CustomerPhoneNumber' => '0551234567',
                'PaymentDetails' => ['MobileMoneyNumber' => '0551234567'],
            ],
        ], 200),
    ]);

    $adapter = app(HubtelAdapter::class);
    $result = $adapter->verify('TXN-HUB-MOMO1');

    expect($result->channel)->toBe('momo');
    expect($result->paymentPhone)->toBe('0551234567');
});

/* PaymentTransactionResource */

it('exposes card_display as BIN***LAST4 when both fields are present', function () {
    $tx = PaymentTransaction::factory()->create([
        'card_bin' => '408408',
        'card_last4' => '4081',
        'card_type' => 'visa',
    ]);

    $resource = (new PaymentTransactionResource($tx))->toArray(request());

    expect($resource['card_bin'])->toBe('408408');
    expect($resource['card_last4'])->toBe('4081');
    expect($resource['card_type'])->toBe('visa');
    expect($resource['card_display'])->toBe('408408***4081');
});

it('returns null card_display when card info is absent', function () {
    $tx = PaymentTransaction::factory()->create([
        'card_bin' => null,
        'card_last4' => null,
        'card_type' => null,
    ]);

    $resource = (new PaymentTransactionResource($tx))->toArray(request());

    expect($resource['card_display'])->toBeNull();
    expect($resource['card_bin'])->toBeNull();
    expect($resource['card_last4'])->toBeNull();
});
