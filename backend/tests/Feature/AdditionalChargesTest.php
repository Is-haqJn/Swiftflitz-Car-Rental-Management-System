<?php

use App\Models\AdditionalCharge;
use App\Models\Branch;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Seed GeneralSettings with a global currency for these tests.
 */
function seedGeneralSettingsForChargeTest(string $currency = 'GHS', string $symbol = '₵'): void
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

it('returns global currency_symbol for a charge with no branch', function () {
    seedGeneralSettingsForChargeTest('GHS', '₵');

    $charge = AdditionalCharge::factory()->create(['branch_id' => null]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/additional-charges/{$charge->id}");

    $response->assertOk();

    expect($response->json('data.currency_symbol'))->toBe('₵')
        ->and($response->json('data.currency'))->toBe('GHS');
});

it('returns branch currency_symbol for a charge belonging to a branch with exchange_rate', function () {
    seedGeneralSettingsForChargeTest('GHS', '₵');

    $branch = Branch::factory()->create([
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.0082,
    ]);

    $charge = AdditionalCharge::factory()->create(['branch_id' => $branch->id]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/additional-charges/{$charge->id}");

    $response->assertOk();

    expect($response->json('data.currency_symbol'))->toBe('₦')
        ->and($response->json('data.currency'))->toBe('NGN');
});
