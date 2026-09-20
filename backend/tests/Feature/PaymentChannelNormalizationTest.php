<?php

use App\Enums\PaymentTransactionStatus;
use App\Models\PaymentTransaction;
use App\Services\AirportBookingService;
use App\Services\ChauffeurBookingService;
use App\Services\Payment\Adapters\PaystackAdapter;
use App\Services\PaymentService;
use App\Services\RentalService;
use App\Settings\PaymentSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function seedChannelTestPaymentConfig(): void
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

/* PaystackAdapter::verify - unknown channel passthrough */

it('paystack adapter preserves unknown channel as raw value', function () {
    seedChannelTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-USSD1' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
                'channel' => 'ussd',
                'customer' => ['phone' => '0244000001'],
                'authorization' => [],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);
    $result = $adapter->verify('TXN-USSD1');

    expect($result->success)->toBeTrue();
    expect($result->channel)->toBe('ussd');
});

it('paystack adapter still maps known channels correctly', function () {
    seedChannelTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MOMO-K' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
                'channel' => 'mobile_money',
                'customer' => ['phone' => '0551234567'],
                'authorization' => ['mobile_money_number' => '0551234567'],
            ],
        ], 200),
        'api.paystack.co/transaction/verify/TXN-CARD-K' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 20000,
                'channel' => 'card',
                'customer' => ['phone' => '0244000002'],
                'authorization' => ['bin' => '408408', 'last4' => '4081', 'card_type' => 'visa'],
            ],
        ], 200),
        'api.paystack.co/transaction/verify/TXN-BANK-K' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 30000,
                'channel' => 'bank_transfer',
                'customer' => ['phone' => '0244000003'],
                'authorization' => [],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);

    expect($adapter->verify('TXN-MOMO-K')->channel)->toBe('momo');
    expect($adapter->verify('TXN-CARD-K')->channel)->toBe('card');
    expect($adapter->verify('TXN-BANK-K')->channel)->toBe('bank_transfer');
});

it('paystack adapter returns null channel for empty string channel', function () {
    seedChannelTestPaymentConfig();

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-EMPTY' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
                'channel' => '',
                'customer' => ['phone' => null],
                'authorization' => [],
            ],
        ], 200),
    ]);

    $adapter = app(PaystackAdapter::class);
    $result = $adapter->verify('TXN-EMPTY');

    expect($result->channel)->toBeNull();
});

/* PaymentService::buildVerifyResultFromPaystackWebhook - unknown channel passthrough */

it('paystack webhook builder preserves unknown channel as raw value', function () {
    seedChannelTestPaymentConfig();

    $service = app(PaymentService::class);
    $method = new ReflectionMethod($service, 'buildVerifyResultFromPaystackWebhook');

    $request = Request::create('/webhook', 'POST', [], [], [], [], json_encode([
        'event' => 'charge.success',
        'data' => [
            'reference' => 'TXN-QR1',
            'status' => 'success',
            'amount' => 10000,
            'channel' => 'qr',
            'customer' => ['phone' => null],
            'authorization' => [],
        ],
    ]));
    $request->headers->set('Content-Type', 'application/json');

    $result = $method->invoke($service, $request);

    expect($result->channel)->toBe('qr');
});

it('paystack webhook builder still maps known channels correctly', function () {
    seedChannelTestPaymentConfig();

    $service = app(PaymentService::class);
    $method = new ReflectionMethod($service, 'buildVerifyResultFromPaystackWebhook');

    $makeRequest = fn (string $channel) => tap(
        Request::create('/webhook', 'POST', [], [], [], [], json_encode([
            'event' => 'charge.success',
            'data' => [
                'reference' => 'TXN-WH-' . strtoupper($channel),
                'status' => 'success',
                'amount' => 10000,
                'channel' => $channel,
                'customer' => ['phone' => null],
                'authorization' => [],
            ],
        ])),
        fn ($r) => $r->headers->set('Content-Type', 'application/json')
    );

    expect($method->invoke($service, $makeRequest('mobile_money'))->channel)->toBe('momo');
    expect($method->invoke($service, $makeRequest('card'))->channel)->toBe('card');
    expect($method->invoke($service, $makeRequest('bank_transfer'))->channel)->toBe('bank_transfer');
});

it('paystack webhook builder returns null channel for empty string', function () {
    seedChannelTestPaymentConfig();

    $service = app(PaymentService::class);
    $method = new ReflectionMethod($service, 'buildVerifyResultFromPaystackWebhook');

    $request = Request::create('/webhook', 'POST', [], [], [], [], json_encode([
        'event' => 'charge.success',
        'data' => [
            'reference' => 'TXN-WH-EMPTY',
            'status' => 'success',
            'amount' => 10000,
            'channel' => '',
            'customer' => ['phone' => null],
            'authorization' => [],
        ],
    ]));
    $request->headers->set('Content-Type', 'application/json');

    $result = $method->invoke($service, $request);

    expect($result->channel)->toBeNull();
});

/* resolvePaymentChannel - RentalService, AirportBookingService, ChauffeurBookingService */

it('resolvePaymentChannel in RentalService preserves unknown method values', function () {
    $service = app(RentalService::class);
    $method = new ReflectionMethod($service, 'resolvePaymentChannel');

    expect($method->invoke($service, 'wallet_pay'))->toBe('wallet_pay');
    expect($method->invoke($service, 'voucher'))->toBe('voucher');
    expect($method->invoke($service, 'WALLET_PAY'))->toBe('wallet_pay');
});

it('resolvePaymentChannel in RentalService returns null for null or empty method', function () {
    $service = app(RentalService::class);
    $method = new ReflectionMethod($service, 'resolvePaymentChannel');

    expect($method->invoke($service, null))->toBeNull();
    expect($method->invoke($service, ''))->toBeNull();
});

it('resolvePaymentChannel in RentalService still maps known channels correctly', function () {
    $service = app(RentalService::class);
    $method = new ReflectionMethod($service, 'resolvePaymentChannel');

    expect($method->invoke($service, 'momo'))->toBe('momo');
    expect($method->invoke($service, 'mobile_money'))->toBe('momo');
    expect($method->invoke($service, 'card'))->toBe('card');
    expect($method->invoke($service, 'cash'))->toBe('cash');
    expect($method->invoke($service, 'bank_transfer'))->toBe('bank_transfer');
    expect($method->invoke($service, 'online'))->toBe('online');
});

it('resolvePaymentChannel in AirportBookingService preserves unknown method values', function () {
    $service = app(AirportBookingService::class);
    $method = new ReflectionMethod($service, 'resolvePaymentChannel');

    expect($method->invoke($service, 'wallet_pay'))->toBe('wallet_pay');
    expect($method->invoke($service, 'USSD'))->toBe('ussd');
    expect($method->invoke($service, ''))->toBeNull();
    expect($method->invoke($service, null))->toBeNull();
});

it('resolvePaymentChannel in ChauffeurBookingService preserves unknown method values', function () {
    $service = app(ChauffeurBookingService::class);
    $method = new ReflectionMethod($service, 'resolvePaymentChannel');

    expect($method->invoke($service, 'voucher'))->toBe('voucher');
    expect($method->invoke($service, 'QR_CODE'))->toBe('qr_code');
    expect($method->invoke($service, ''))->toBeNull();
    expect($method->invoke($service, null))->toBeNull();
});

it('paystack webhook end-to-end stores unknown channel on transaction', function () {
    seedChannelTestPaymentConfig();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-USSD-WH',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 100.00,
        'channel' => null,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-USSD-WH' => Http::response([
            'status' => true,
            'data' => [
                'status' => 'success',
                'amount' => 10000,
                'channel' => 'ussd',
                'customer' => ['phone' => '0244000099'],
                'authorization' => [],
            ],
        ], 200),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => [
            'reference' => 'TXN-USSD-WH',
            'status' => 'success',
            'amount' => 10000,
            'channel' => 'ussd',
            'customer' => ['phone' => '0244000099'],
            'authorization' => [],
        ],
    ]);

    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    $tx = PaymentTransaction::where('reference', 'TXN-USSD-WH')->first();
    expect($tx->channel)->toBe('ussd');
    expect($tx->status->value)->toBe('paid');
});
