<?php

use App\Models\Branch;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Seed general settings with a given currency so the exchange rate
 * validation rules have a global currency to compare against.
 */
function seedGeneralSettingsForBranchTest(string $currency = 'GHS', string $symbol = '₵'): void
{
    $settings = app(GeneralSettings::class);
    $settings->site_name = 'Swiftflitz';
    $settings->site_email = 'info@swiftflitz.com';
    $settings->site_phone = '+233201234567';
    $settings->site_address = '123 Main St';
    $settings->currency = $currency;
    $settings->currency_symbol = $symbol;
    $settings->timezone = 'Africa/Accra';
    $settings->logo_url = null;
    $settings->favicon_url = null;
    $settings->maintenance_mode = false;
    $settings->save();
}

it('saves a branch with a custom currency and exchange rate', function () {
    seedGeneralSettingsForBranchTest('GHS');

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/branches', [
            'name' => 'Lagos Branch',
            'is_active' => true,
            'currency' => 'NGN',
            'currency_symbol' => '₦',
            'exchange_rate' => 0.0082,
        ]);

    $response->assertCreated();

    expect($response->json('data.exchange_rate'))->toBe(0.0082)
        ->and($response->json('data.show_converted_price'))->toBeBool();
});

it('rejects a branch with currency code and symbol but no exchange rate', function () {
    seedGeneralSettingsForBranchTest('GHS');

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/branches', [
            'name' => 'Lagos Branch',
            'is_active' => true,
            'currency' => 'NGN',
            'currency_symbol' => '₦',
        ]);

    $response->assertUnprocessable();

    expect($response->json('errors'))->toHaveKey('exchange_rate');
});

it('allows creating a branch with currency code only (no symbol) without exchange rate', function () {
    seedGeneralSettingsForBranchTest('GHS');

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/branches', [
            'name' => 'Lagos Branch',
            'is_active' => true,
            'currency' => 'NGN',
        ]);

    $response->assertCreated();
});

it('allows creating a branch whose currency matches the global currency without exchange rate', function () {
    seedGeneralSettingsForBranchTest('GHS');

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/branches', [
            'name' => 'Accra Branch',
            'is_active' => true,
            'currency' => 'GHS',
        ]);

    $response->assertCreated();
});

it('updates a branch exchange rate and show_converted_price toggle', function () {
    seedGeneralSettingsForBranchTest('GHS');

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
        'show_converted_price' => true,
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/branches/{$branch->id}", [
            'exchange_rate' => 0.009,
            'show_converted_price' => false,
        ]);

    $response->assertOk();

    expect((float) $response->json('data.exchange_rate'))->toBe(0.009)
        ->and($response->json('data.show_converted_price'))->toBeFalse();
});
