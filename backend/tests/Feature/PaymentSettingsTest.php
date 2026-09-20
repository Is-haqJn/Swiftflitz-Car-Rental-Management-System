<?php

use App\Models\User;
use App\Settings\PaymentSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * Seed payment settings with the given values.
 *
 * @param  array<string, mixed>  $overrides
 */
function seedPaymentSettings(array $overrides = []): void
{
    $settings = app(PaymentSettings::class);

    $defaults = [
        'payment_provider' => 'paystack',
        'paystack_public_key' => 'pk_test_public',
        'paystack_secret_key' => 'sk_test_secret',
        'stripe_public_key' => '',
        'stripe_secret_key' => '',
        'enable_online_payments' => false,
        'enable_paystack' => true,
        'enable_stripe' => false,
        'payment_currency' => 'GHS',
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* GET /api/v1/settings/payment */
it('requires authentication to view payment settings', function () {
    $this->getJson('/api/v1/settings/payment')
        ->assertStatus(401);
});

it('can show payment settings when authenticated', function () {
    $user = User::factory()->create();
    seedPaymentSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/payment')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data)->toHaveKey('payment_provider')
        ->and($data)->toHaveKey('payment_currency')
        ->and($data)->toHaveKey('enable_online_payments')
        ->and($data)->toHaveKey('enable_paystack')
        ->and($data)->toHaveKey('enable_stripe');
});

it('masks paystack secret key in response', function () {
    $user = User::factory()->create();
    seedPaymentSettings(['paystack_secret_key' => 'sk_live_verysecretkey']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/payment')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data['paystack_secret_key'])->toBe('••••••••••••••••')
        ->and($data['paystack_secret_key'])->not->toBe('sk_live_verysecretkey');
});

it('masks stripe secret key in response', function () {
    $user = User::factory()->create();
    seedPaymentSettings(['stripe_secret_key' => 'sk_live_stripesecretkey']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/payment')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data['stripe_secret_key'])->toBe('••••••••••••••••')
        ->and($data['stripe_secret_key'])->not->toBe('sk_live_stripesecretkey');
});

it('does not mask empty secret keys', function () {
    $user = User::factory()->create();
    seedPaymentSettings(['paystack_secret_key' => '', 'stripe_secret_key' => '']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/payment')
        ->assertStatus(200);

    $data = $response->json('data');

    expect($data['paystack_secret_key'])->toBe('')
        ->and($data['stripe_secret_key'])->toBe('');
});

/* PUT /api/v1/settings/payment */
it('requires authentication to update payment settings', function () {
    $this->putJson('/api/v1/settings/payment', [
        'payment_provider' => 'stripe',
    ])->assertStatus(401);
});

it('can update payment provider', function () {
    seedPaymentSettings(['payment_provider' => 'paystack']);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/payment', [
            'payment_provider' => 'stripe',
        ])
        ->assertStatus(200);

    $settings = app(PaymentSettings::class);
    expect($settings->payment_provider)->toBe('stripe');
});

it('can update payment currency', function () {
    seedPaymentSettings(['payment_currency' => 'GHS']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/payment', [
            'payment_currency' => 'USD',
        ])
        ->assertStatus(200);

    $settings = app(PaymentSettings::class);
    expect($settings->payment_currency)->toBe('USD');
});

it('can toggle online payment flags', function () {
    seedPaymentSettings([
        'enable_online_payments' => false,
        'enable_paystack' => false,
        'enable_stripe' => false,
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/payment', [
            'enable_online_payments' => true,
            'enable_paystack' => true,
        ])
        ->assertStatus(200);

    $data = $response->json('data');
    expect($data['enable_online_payments'])->toBeTrue()
        ->and($data['enable_paystack'])->toBeTrue()
        ->and($data['enable_stripe'])->toBeFalse();
});

it('can update paystack keys', function () {
    seedPaymentSettings();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/payment', [
            'paystack_public_key' => 'pk_live_newpublic',
            'paystack_secret_key' => 'sk_live_newsecret',
        ])
        ->assertStatus(200);

    $settings = app(PaymentSettings::class);
    expect($settings->paystack_public_key)->toBe('pk_live_newpublic')
        ->and($settings->paystack_secret_key)->toBe('sk_live_newsecret');
});

it('rejects invalid payment provider', function () {
    $user = User::factory()->create();
    seedPaymentSettings();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/payment', [
            'payment_provider' => 'bitcoin',
        ])
        ->assertStatus(422);
});
