<?php

use App\Enums\AirportPaymentStatus;
use App\Enums\ChauffeurPaymentStatus;
use App\Enums\PaymentTransactionStatus;
use App\Enums\RentalPaymentStatus;
use App\Enums\TransactionType;
use App\Events\PaymentStatusUpdated;
use App\Mail\PaymentConfirmationMail;
use App\Models\AirportBooking;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Settings\GeneralSettings;
use App\Settings\PaymentSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/* Helpers */

function seedPaymentConfig(array $overrides = []): void
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
        'enable_hubtel' => false,
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

function fakePaystackSuccess(): void
{
    Http::fake([
        'api.paystack.co/transaction/initialize' => Http::response([
            'status' => true,
            'data' => [
                'authorization_url' => 'https://paystack.com/pay/test',
                'access_code' => 'acc_test',
                'reference' => 'TXN-TEST',
            ],
        ], 200),
    ]);
}

function validPayload(string $transactableId, array $overrides = []): array
{
    return array_merge([
        'amount' => 150.00,
        'currency' => 'GHS',
        'payer_email' => 'test@example.com',
        'payer_phone' => '0200000001',
        'payer_name' => 'Test User',
        'transactable_type' => 'rental',
        'transactable_id' => $transactableId,
    ], $overrides);
}

/* POST /api/v1/payments/initiate */

it('creates a payment transaction and returns authorization url', function () {
    seedPaymentConfig();
    fakePaystackSuccess();

    $rental = Rental::factory()->create(['total_cost' => 150.00, 'amount_paid' => 0.00]);

    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201)
        ->assertJsonPath('data.authorization_url', 'https://paystack.com/pay/test');

    expect(PaymentTransaction::count())->toBe(1);

    $transaction = PaymentTransaction::first();
    expect($transaction->status)->toBe(PaymentTransactionStatus::Pending)
        ->and($transaction->payer_email)->toBe('test@example.com')
        ->and($transaction->payer_phone)->toBe('0200000001');
});

it('uses the db total_cost not the client-supplied amount (security)', function () {
    seedPaymentConfig();
    fakePaystackSuccess();

    $rental = Rental::factory()->create(['total_cost' => 500.00, 'amount_paid' => 0.00]);

    /* Client tries to pay only 1.00 by tampering the request */
    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id, ['amount' => 1.00]))
        ->assertStatus(201);

    $transaction = PaymentTransaction::first();

    /* The recorded amount must be the rental total_cost (500.00), not the tampered 1.00 */
    expect((float) $transaction->amount)->toBe(500.00);
});

it('returns 422 when transactable is not found', function () {
    seedPaymentConfig();

    $this->postJson('/api/v1/payments/initiate', validPayload('00000000-0000-0000-0000-000000000099'))
        ->assertStatus(422);
});

it('returns 422 when payer_phone is missing', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create();
    $payload = validPayload($rental->id);
    unset($payload['payer_phone']);

    $this->postJson('/api/v1/payments/initiate', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['payer_phone']);
});

it('returns 422 when payer_email is missing', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create();
    $payload = validPayload($rental->id);
    unset($payload['payer_email']);

    $this->postJson('/api/v1/payments/initiate', $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['payer_email']);
});

it('returns 422 when transactable_type is invalid', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create();

    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id, ['transactable_type' => 'invalid']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['transactable_type']);
});

it('returns error response when provider api fails', function () {
    seedPaymentConfig();

    Http::fake([
        'api.paystack.co/*' => Http::response(['status' => false, 'message' => 'Invalid key'], 401),
    ]);

    $rental = Rental::factory()->create();

    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(422);
});

it('reuses existing pending transaction on retry instead of creating a duplicate', function () {
    seedPaymentConfig();
    fakePaystackSuccess();

    $rental = Rental::factory()->create(['total_cost' => 150.00, 'amount_paid' => 0.00]);

    /* First initiate */
    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201);

    expect(PaymentTransaction::count())->toBe(1);
    $firstRef = PaymentTransaction::first()->reference;

    /* Second initiate - customer abandoned and retried */
    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201);

    /* Still only 1 transaction - reused, not duplicated */
    expect(PaymentTransaction::count())->toBe(1);

    /* Reference updated to the latest provider reference */
    expect(PaymentTransaction::first()->reference)->not->toBe($firstRef);
});

it('does not reuse a damage pending transaction for a normal payment retry', function () {
    seedPaymentConfig();
    fakePaystackSuccess();

    $rental = Rental::factory()->create([
        'total_cost' => 300.00,
        'amount_paid' => 0.00,
        'estimated_repair_cost' => 100.00,
        'damage_settlement_status' => 'pending',
    ]);

    /* Existing pending RepairCost from a damage payment initiation */
    PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'status' => PaymentTransactionStatus::Pending,
        'type' => TransactionType::RepairCost->value,
        'metadata' => ['purpose' => 'damage'],
        'amount' => 100.00,
    ]);

    /* Normal payment initiation must not reuse the damage RepairCost tx */
    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201);

    /* 2 transactions: the damage RepairCost + a new standard Payment */
    expect(PaymentTransaction::count())->toBe(2);
});

/* GET /api/v1/payments/payable-amount */

it('returns the rental total_cost as the payable amount', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create(['total_cost' => 300.00, 'amount_paid' => 50.00]);

    $response = $this->getJson("/api/v1/payments/payable-amount?transactable_type=rental&transactable_id={$rental->id}")
        ->assertStatus(200)
        ->assertJsonPath('data.currency', 'GHS');

    /* Outstanding balance is returned (total_cost - amount_paid) */
    expect((float) $response->json('data.amount'))->toBe(250.0);
});

it('returns the total amount for an airport booking', function () {
    seedPaymentConfig();

    $booking = AirportBooking::factory()->create(['total_amount' => 180.00]);

    $response = $this->getJson("/api/v1/payments/payable-amount?transactable_type=airport_booking&transactable_id={$booking->id}")
        ->assertStatus(200);

    expect((float) $response->json('data.amount'))->toBe(180.0);
});

it('returns 404 for a non-existent transactable', function () {
    seedPaymentConfig();

    $this->getJson('/api/v1/payments/payable-amount?transactable_type=rental&transactable_id=00000000-0000-0000-0000-000000000099')
        ->assertStatus(404);
});

it('payable-amount validates transactable_type', function () {
    seedPaymentConfig();

    $this->getJson('/api/v1/payments/payable-amount?transactable_type=invalid&transactable_id=00000000-0000-0000-0000-000000000001')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['transactable_type']);
});

/* GET /api/v1/payments/verify/{reference} */
it('returns paid status when paystack confirms success', function () {
    seedPaymentConfig();

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-VERIFY123',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-VERIFY123' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 15000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-VERIFY123')
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'paid');

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
});

it('returns pending status for unknown reference', function () {
    seedPaymentConfig();

    $this->getJson('/api/v1/payments/verify/UNKNOWN-REF')
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'pending');
});

/* POST /api/v1/payments/webhook/paystack */
it('returns 200 and updates status on valid paystack webhook', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    /* amount must match 15000 kobo = 150.00 to pass the amount mismatch check */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-WEBHOOK1',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 150.00,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-WEBHOOK1' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 15000],
        ], 200),
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-WEBHOOK1']]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
        'Content-Type' => 'application/json',
    ])->assertStatus(200)
        ->assertJsonPath('status', 'ok');

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
    Event::assertDispatched(PaymentStatusUpdated::class);
});

it('returns 200 and ignores invalid paystack webhook signature', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-WEBHOOK2',
        'provider' => 'paystack',
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-WEBHOOK2']]);

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => 'invalid-signature',
        'Content-Type' => 'application/json',
    ])->assertStatus(200);

    // Status should NOT have changed
    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Pending);
    Event::assertNotDispatched(PaymentStatusUpdated::class);
});

it('is idempotent - does not re-fire event when transaction is already paid', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'reference' => 'TXN-PAID',
        'provider' => 'paystack',
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-PAID']]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    Event::assertNotDispatched(PaymentStatusUpdated::class);
});

it('marks paystack transaction paid from webhook payload when verify api fails', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    /* amount must match 15000 kobo = 150.00 to pass the amount mismatch check */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-WH1',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 150.00,
        'channel' => null,
        'payment_phone' => null,
    ]);

    Http::fake([
        'api.paystack.co/*' => Http::response(null, 500),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => [
            'reference' => 'TXN-PS-WH1',
            'status' => 'success',
            'amount' => 15000,
            'channel' => 'mobile_money',
            'authorization' => ['mobile_money_number' => '233241234567'],
        ],
    ]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
    expect($transaction->fresh()->channel)->toBe('momo');
    expect($transaction->fresh()->payment_phone)->toBe('233241234567');
    Event::assertDispatched(PaymentStatusUpdated::class);
});

it('uses verify result over webhook result when paystack verify api succeeds', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    /* amount must match 15000 kobo = 150.00 to pass the amount mismatch check */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-WH2',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 150.00,
        'channel' => null,
    ]);

    Http::fake([
        'api.paystack.co/*' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 15000, 'channel' => 'card'],
        ], 200),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'TXN-PS-WH2', 'status' => 'success', 'amount' => 15000],
    ]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
    expect($transaction->fresh()->channel)->toBe('card');
    Event::assertDispatched(PaymentStatusUpdated::class);
});

it('marks paystack transaction failed from webhook payload when charge fails and verify api is unreachable', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-PS-WH3',
        'provider' => 'paystack',
        'status' => PaymentTransactionStatus::Pending,
        'channel' => null,
    ]);

    Http::fake([
        'api.paystack.co/*' => Http::response(null, 500),
    ]);

    $payload = json_encode([
        'event' => 'charge.success',
        'data' => ['reference' => 'TXN-PS-WH3', 'status' => 'failed', 'amount' => 15000],
    ]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Failed);
    Event::assertDispatched(PaymentStatusUpdated::class);
});

/* GET /api/v1/settings/payment-config */
it('public payment config exposes provider, stripe key, hubtel id and logo urls', function () {
    seedPaymentConfig([
        'paystack_logo_url' => 'https://example.com/paystack.png',
        'stripe_logo_url' => null,
        'hubtel_logo_url' => null,
    ]);

    $response = $this->getJson('/api/v1/settings/payment-config')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data)->toHaveKeys([
        'payment_provider', 'paystack_public_key', 'stripe_public_key',
        'hubtel_client_id', 'payment_currency', 'enable_online_payments',
        'enable_paystack', 'enable_stripe', 'enable_hubtel',
        'paystack_logo_url', 'stripe_logo_url', 'hubtel_logo_url',
    ])
        ->and($data['payment_provider'])->toBe('paystack')
        ->and($data['paystack_logo_url'])->toBe('https://example.com/paystack.png');
});

it('public payment config does not expose secret keys', function () {
    seedPaymentConfig();

    $response = $this->getJson('/api/v1/settings/payment-config')->assertStatus(200);

    $data = $response->json('data');

    expect($data)->not->toHaveKey('paystack_secret_key')
        ->and($data)->not->toHaveKey('stripe_secret_key')
        ->and($data)->not->toHaveKey('hubtel_client_secret');
});

/* MarkTransactableAsPaid listener */
it('marks rental as fully paid when verify confirms success', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create(['total_cost' => 150.00, 'amount_paid' => 0.00]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-MARK-RENTAL',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 150.00,
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MARK-RENTAL' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 15000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-MARK-RENTAL')->assertStatus(200);

    expect((float) $rental->fresh()->amount_paid)->toBe(150.0)
        ->and($rental->fresh()->payment_status)->toBe(RentalPaymentStatus::Paid);
});

it('marks rental as partially paid when amount is less than total', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create(['total_cost' => 300.00, 'amount_paid' => 0.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-MARK-PARTIAL',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 150.00,
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MARK-PARTIAL' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 15000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-MARK-PARTIAL')->assertStatus(200);

    expect((float) $rental->fresh()->amount_paid)->toBe(150.0)
        ->and($rental->fresh()->payment_status)->toBe(RentalPaymentStatus::PartiallyPaid);
});

it('marks airport booking as paid when verify confirms success', function () {
    seedPaymentConfig();

    $booking = AirportBooking::factory()->create(['total_amount' => 180.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-MARK-AIRPORT',
        'provider' => 'paystack',
        'transactable_type' => 'airport_booking',
        'transactable_id' => $booking->id,
        'amount' => 180.00,
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MARK-AIRPORT' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 18000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-MARK-AIRPORT')->assertStatus(200);

    expect($booking->fresh()->payment_status)->toBe(AirportPaymentStatus::Paid);
});

/* purpose=damage payment flow */

it('payable-amount returns only damage amount when purpose=damage', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'estimated_repair_cost' => 250.00,
        'damage_balance_due' => null,
    ]);

    $response = $this->getJson(
        "/api/v1/payments/payable-amount?transactable_type=rental&transactable_id={$rental->id}&purpose=damage"
    )->assertStatus(200);

    expect((float) $response->json('data.amount'))->toBe(250.0);
});

it('payable-amount with purpose=damage uses damage_balance_due when set', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'estimated_repair_cost' => 250.00,
        'damage_balance_due' => 150.00,
    ]);

    $response = $this->getJson(
        "/api/v1/payments/payable-amount?transactable_type=rental&transactable_id={$rental->id}&purpose=damage"
    )->assertStatus(200);

    expect((float) $response->json('data.amount'))->toBe(150.0);
});

it('payable-amount without purpose returns zero when rental is fully paid (damage excluded from main formula)', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'estimated_repair_cost' => 250.00,
        'damage_balance_due' => null,
    ]);

    $response = $this->getJson(
        "/api/v1/payments/payable-amount?transactable_type=rental&transactable_id={$rental->id}"
    )->assertStatus(200);

    /* Damage is handled via purpose=damage - excluded from the main rental payment link. */
    expect((float) $response->json('data.amount'))->toBe(0.0);
});

it('damage payment with purpose=damage metadata settles damage and does not touch amount_paid', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'payment_status' => RentalPaymentStatus::Paid,
        'has_damage' => true,
        'damage_balance_due' => 250.00,
        'damage_settlement_status' => 'pending',
    ]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-DAMAGE-PAY',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 250.00,
        'status' => PaymentTransactionStatus::Pending,
        'metadata' => ['purpose' => 'damage'],
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-DAMAGE-PAY' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 25000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-DAMAGE-PAY')->assertStatus(200);

    $rental->refresh();

    expect((float) $rental->amount_paid)->toBe(500.0)
        ->and($rental->damage_settlement_status)->toBe('settled')
        ->and($rental->damage_balance_due)->toBeNull();
});

it('damage payment tags transaction type as DamageCharge when no pending RepairCost exists', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'has_damage' => true,
        'damage_balance_due' => 200.00,
        'damage_settlement_status' => 'pending',
    ]);

    /* type defaults to 'payment' per migration default - listener will overwrite to 'damage_charge' */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-DAMAGE-TYPE',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 200.00,
        'status' => PaymentTransactionStatus::Pending,
        'metadata' => ['purpose' => 'damage'],
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-DAMAGE-TYPE' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 20000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-DAMAGE-TYPE')->assertStatus(200);

    expect($transaction->fresh()->type->value)->toBe('damage_charge');
});

it('damage online payment merges into existing pending RepairCost transaction', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create([
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
        'has_damage' => true,
        'damage_balance_due' => 350.00,
        'damage_settlement_status' => 'pending',
    ]);

    /* Existing pending RepairCost from recordRepairCost() */
    $repairCostTx = PaymentTransaction::factory()->create([
        'reference' => 'DMG-REPAIR-ORIG',
        'provider' => 'manual',
        'type' => TransactionType::RepairCost->value,
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 350.00,
        'status' => PaymentTransactionStatus::Pending->value,
    ]);

    /* Online payment transaction created by PaymentService::initiate() */
    $onlineTx = PaymentTransaction::factory()->create([
        'reference' => 'TXN-DAMAGE-MERGE',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 350.00,
        'status' => PaymentTransactionStatus::Pending->value,
        'metadata' => ['purpose' => 'damage'],
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-DAMAGE-MERGE' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 35000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-DAMAGE-MERGE')->assertStatus(200);

    /* The pending RepairCost estimate should be deleted (replaced by the online payment) */
    expect(PaymentTransaction::where('reference', 'DMG-REPAIR-ORIG')->exists())->toBeFalse();

    /* The online payment transaction should be tagged as DamageCharge */
    $onlineTx->refresh();
    expect($onlineTx->type->value)->toBe('damage_charge')
        ->and($onlineTx->status->value)->toBe('paid');

    /* Rental damage fields are settled */
    $rental->refresh();
    expect($rental->damage_settlement_status)->toBe('settled')
        ->and($rental->damage_balance_due)->toBeNull();
});

it('airport booking online payment is tagged as FullPayment', function () {
    seedPaymentConfig();

    $booking = AirportBooking::factory()->create(['total_amount' => 180.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-AIRPORT-TYPE',
        'provider' => 'paystack',
        'transactable_type' => 'airport_booking',
        'transactable_id' => $booking->id,
        'amount' => 180.00,
        'status' => PaymentTransactionStatus::Pending->value,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-AIRPORT-TYPE' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 18000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-AIRPORT-TYPE')->assertStatus(200);

    $tx = PaymentTransaction::where('reference', 'TXN-AIRPORT-TYPE')->first();
    expect($tx->type->value)->toBe(TransactionType::FullPayment->value)
        ->and($booking->fresh()->payment_status)->toBe(AirportPaymentStatus::Paid);
});

it('chauffeur booking online payment is tagged as FullPayment', function () {
    seedPaymentConfig();

    $booking = ChauffeurBooking::factory()->create(['total_amount' => 220.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-CHAUFFEUR-TYPE',
        'provider' => 'paystack',
        'transactable_type' => 'chauffeur_booking',
        'transactable_id' => $booking->id,
        'amount' => 220.00,
        'status' => PaymentTransactionStatus::Pending->value,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-CHAUFFEUR-TYPE' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 22000, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-CHAUFFEUR-TYPE')->assertStatus(200);

    $tx = PaymentTransaction::where('reference', 'TXN-CHAUFFEUR-TYPE')->first();
    expect($tx->type->value)->toBe(TransactionType::FullPayment->value)
        ->and($booking->fresh()->payment_status)->toBe(ChauffeurPaymentStatus::Paid);
});

/* POST /api/v1/payments/webhook/hubtel */

it('flags hubtel transaction as under_review when verify api fails', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUBTEL-WH1',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'channel' => null,
        'payment_phone' => null,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response(null, 403),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-WH1',
            'Status' => 'Success',
            'Amount' => 50.00,
            'CustomerPhoneNumber' => '233242825109',
            'PaymentDetails' => [
                'MobileMoneyNumber' => '233242825109',
                'PaymentType' => 'mobilemoney',
                'Channel' => 'mtn-gh',
            ],
        ],
    ])->assertStatus(200)->assertJsonPath('status', 'ok');

    /* When verify() is unreachable, the transaction is flagged for manual review. */
    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::UnderReview);
    Event::assertNotDispatched(PaymentStatusUpdated::class);
});

it('uses verify result over webhook result when hubtel verify api succeeds', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    /*
     * Set amount to 50.00 to match the verify result from Hubtel.
     * The amount mismatch check compares gateway_amount (if set) or amount against what Hubtel reports.
     */
    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUBTEL-WH2',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'channel' => null,
        'amount' => 50.00,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => ['status' => 'Paid', 'amount' => 50.00, 'paymentMethod' => 'card'],
        ], 200),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-WH2',
            'Status' => 'Success',
            'Amount' => 50.00,
        ],
    ])->assertStatus(200)->assertJsonPath('status', 'ok');

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
    Event::assertDispatched(PaymentStatusUpdated::class);
});

it('does not mark hubtel transaction paid when webhook ResponseCode is not 0000', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUBTEL-WH3',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'channel' => null,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response(null, 403),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '9999',
        'Status' => 'Failed',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-WH3',
            'Status' => 'Failed',
        ],
    ])->assertStatus(200);

    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Pending);
    Event::assertNotDispatched(PaymentStatusUpdated::class);
});

it('is idempotent for hubtel - does not re-fire event when transaction is already paid', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'reference' => 'TXN-HUBTEL-IDEM',
        'provider' => 'hubtel',
    ]);

    /* Simulate a duplicate Hubtel callback arriving for an already-paid transaction. */
    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-IDEM',
            'Status' => 'Success',
            'Amount' => (float) $transaction->amount,
            'CustomerPhoneNumber' => '233242825109',
        ],
    ])->assertStatus(200);

    Event::assertNotDispatched(PaymentStatusUpdated::class);
    expect($transaction->fresh()->status)->toBe(PaymentTransactionStatus::Paid);
});

it('marks chauffeur booking as paid via webhook path', function () {
    seedPaymentConfig();
    Event::fake([PaymentStatusUpdated::class]);

    $booking = ChauffeurBooking::factory()->create(['total_amount' => 200.00]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-MARK-CHAUFFEUR',
        'provider' => 'paystack',
        'transactable_type' => 'chauffeur_booking',
        'transactable_id' => $booking->id,
        'amount' => 200.00,
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-MARK-CHAUFFEUR' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 20000],
        ], 200),
    ]);

    $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'TXN-MARK-CHAUFFEUR']]);
    $signature = hash_hmac('sha512', $payload, 'sk_test_secret');

    $this->postJson('/api/v1/payments/webhook/paystack', json_decode($payload, true), [
        'X-Paystack-Signature' => $signature,
    ])->assertStatus(200);

    Event::assertDispatched(PaymentStatusUpdated::class, function ($event) {
        return $event->transaction->reference === 'TXN-MARK-CHAUFFEUR';
    });
});

/* verify() DB short-circuit */

it('verify returns paid from db without calling adapter when transaction is already paid', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create(['total_cost' => 100.00, 'amount_paid' => 100.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-ALREADY-PAID',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 100.00,
        'status' => PaymentTransactionStatus::Paid,
    ]);

    Http::preventStrayRequests();

    $response = $this->getJson('/api/v1/payments/verify/TXN-ALREADY-PAID')
        ->assertSuccessful();

    expect($response->json('data.status'))->toBe('paid');
});

it('verify returns failed from db without calling adapter when transaction is already failed', function () {
    seedPaymentConfig();

    $rental = Rental::factory()->create();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-ALREADY-FAILED',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 100.00,
        'status' => PaymentTransactionStatus::Failed,
    ]);

    Http::preventStrayRequests();

    $response = $this->getJson('/api/v1/payments/verify/TXN-ALREADY-FAILED')
        ->assertSuccessful();

    expect($response->json('data.status'))->toBe('failed');
});

/* GET /api/v1/payments/status/{reference} */

it('status endpoint returns pending for unknown reference', function () {
    $response = $this->getJson('/api/v1/payments/status/TXN-UNKNOWN')
        ->assertSuccessful();

    expect($response->json('data.status'))->toBe('pending')
        ->and($response->json('data.reference'))->toBe('TXN-UNKNOWN');
});

it('status endpoint returns paid status from db', function () {
    $rental = Rental::factory()->create(['total_cost' => 200.00]);

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-STATUS-PAID',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 200.00,
        'status' => PaymentTransactionStatus::Paid,
    ]);

    $response = $this->getJson('/api/v1/payments/status/TXN-STATUS-PAID')
        ->assertSuccessful();

    expect($response->json('data.status'))->toBe('paid')
        ->and($response->json('data.reference'))->toBe('TXN-STATUS-PAID');
});

it('status endpoint returns failed status from db', function () {
    $rental = Rental::factory()->create();

    PaymentTransaction::factory()->create([
        'reference' => 'TXN-STATUS-FAILED',
        'provider' => 'hubtel',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 100.00,
        'status' => PaymentTransactionStatus::Failed,
    ]);

    $response = $this->getJson('/api/v1/payments/status/TXN-STATUS-FAILED')
        ->assertSuccessful();

    expect($response->json('data.status'))->toBe('failed');
});

it('status endpoint is publicly accessible without authentication', function () {
    $this->getJson('/api/v1/payments/status/TXN-ANY-REF')
        ->assertSuccessful();
});

/* GHS conversion - branch-currency amount stored in ledger */

it('initiate stores branch-currency amount in transaction when provider requires GHS conversion', function () {
    seedPaymentConfig(['payment_provider' => 'paystack', 'payment_currency' => 'GHS']);
    fakePaystackSuccess();

    /* Global currency = GHS */
    $generalSettings = app(GeneralSettings::class);
    $generalSettings->currency = 'GHS';
    $generalSettings->currency_symbol = '₵';
    $generalSettings->save();

    /* Lagos branch uses NGN with exchange rate 0.0082 (1 NGN = 0.0082 GHS) */
    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    /* Rental cost = ₦1,000 NGN; Paystack would charge 1000 * 0.0082 = 8.20 GHS */
    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 1000.00,
        'amount_paid' => 0.00,
    ]);

    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201);

    $tx = PaymentTransaction::first();

    /* Ledger amount must be in branch currency (NGN), not the GHS amount sent to Paystack */
    expect((float) $tx->amount)->toBe(1000.0)
        ->and($tx->currency)->toBe('NGN');
});

it('rental amount_paid is updated in branch currency after GHS-converted payment completes', function () {
    seedPaymentConfig(['payment_currency' => 'GHS']);

    /* Global currency = GHS */
    $generalSettings = app(GeneralSettings::class);
    $generalSettings->currency = 'GHS';
    $generalSettings->currency_symbol = '₵';
    $generalSettings->save();

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 1000.00,
        'amount_paid' => 0.00,
    ]);

    /* Transaction already stores the branch-currency amount (post-fix) */
    PaymentTransaction::factory()->create([
        'reference' => 'TXN-NGN-PAID',
        'provider' => 'paystack',
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 1000.00,
        'currency' => 'NGN',
        'status' => PaymentTransactionStatus::Pending,
    ]);

    Http::fake([
        'api.paystack.co/transaction/verify/TXN-NGN-PAID' => Http::response([
            'status' => true,
            'data' => ['status' => 'success', 'amount' => 820, 'gateway_response' => 'Approved'],
        ], 200),
    ]);

    $this->getJson('/api/v1/payments/verify/TXN-NGN-PAID')->assertStatus(200);

    $rental->refresh();

    /* amount_paid must reflect the branch NGN amount (1000), not the 8.20 GHS charged to Paystack */
    expect((float) $rental->amount_paid)->toBe(1000.0)
        ->and($rental->payment_status)->toBe(RentalPaymentStatus::Paid);
});

it('initiate sets exchange_rate to 1.0 when branch uses the global currency', function () {
    seedPaymentConfig(['payment_provider' => 'paystack', 'payment_currency' => 'GHS']);
    fakePaystackSuccess();

    /* Global currency = GHS; branch also uses GHS (no custom rate) */
    $generalSettings = app(GeneralSettings::class);
    $generalSettings->currency = 'GHS';
    $generalSettings->currency_symbol = '₵';
    $generalSettings->save();

    $branch = Branch::factory()->create([
        'currency' => 'GHS',
        'currency_symbol' => '₵',
        'exchange_rate' => null,
    ]);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'total_cost' => 500.00,
        'amount_paid' => 0.00,
    ]);

    $this->postJson('/api/v1/payments/initiate', validPayload($rental->id))
        ->assertStatus(201);

    $tx = PaymentTransaction::first();

    /* exchange_rate must be 1.0, not null, so toGlobal() treats it as pass-through */
    expect((float) $tx->exchange_rate)->toBe(1.0);
});

/* Payment confirmation email - provider_reference must not be shown to customers */

it('payment confirmation email does not render provider_reference', function () {
    $rental = Rental::factory()->create(['total_cost' => 100.00]);

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'provider' => 'hubtel',
        'provider_reference' => 'HUBTEL-INTERNAL-XYZ9876',
        'amount' => 100.00,
        'status' => PaymentTransactionStatus::Paid,
    ]);

    $mailable = new PaymentConfirmationMail($transaction);
    $rendered = $mailable->render();

    expect($rendered)->not->toContain('Provider Reference')
        ->and($rendered)->not->toContain('HUBTEL-INTERNAL-XYZ9876');
});

/* Hubtel verify() paymentPhone - CustomerPhoneNumber, not externalTransactionId */

it('hubtel verify stores CustomerPhoneNumber as payment_phone, not externalTransactionId', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUBTEL-PHONE1',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 100.00,
        'channel' => null,
        'payment_phone' => null,
    ]);

    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response([
            'responseCode' => '0000',
            'data' => [
                'status' => 'Paid',
                'amount' => 100.00,
                'paymentMethod' => 'mobilemoney',
                'CustomerPhoneNumber' => '233554130056',
                'externalTransactionId' => '80317367576',
            ],
        ], 200),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-PHONE1',
            'Status' => 'Success',
            'Amount' => 100.00,
        ],
    ])->assertStatus(200);

    /* CustomerPhoneNumber must be stored, not externalTransactionId */
    expect($transaction->fresh()->payment_phone)->toBe('233554130056')
        ->and($transaction->fresh()->payment_phone)->not->toBe('80317367576');
});

it('hubtel webhook buildVerifyResult stores CustomerPhoneNumber as payment_phone', function () {
    seedPaymentConfig(['hubtel_merchant_account_number' => '11684']);
    Event::fake([PaymentStatusUpdated::class]);

    $transaction = PaymentTransaction::factory()->create([
        'reference' => 'TXN-HUBTEL-PHONE2',
        'provider' => 'hubtel',
        'status' => PaymentTransactionStatus::Pending,
        'amount' => 75.00,
        'channel' => null,
        'payment_phone' => null,
    ]);

    /* Verify API fails - fallback to webhook payload */
    Http::fake([
        'api-txnstatus.hubtel.com/*' => Http::response(null, 403),
    ]);

    $this->postJson('/api/v1/payments/webhook/hubtel', [
        'ResponseCode' => '0000',
        'Status' => 'Success',
        'Data' => [
            'ClientReference' => 'TXN-HUBTEL-PHONE2',
            'Status' => 'Success',
            'Amount' => 75.00,
            'CustomerPhoneNumber' => '233244000001',
            'PaymentDetails' => [
                'MobileMoneyNumber' => '233244000001',
                'PaymentType' => 'mobilemoney',
            ],
        ],
    ])->assertStatus(200);

    /* When under_review, payment_phone should still be captured from webhook payload */
    expect($transaction->fresh()->payment_phone)->toBe('233244000001');
});
