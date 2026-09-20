<?php

use App\Models\User;
use App\Services\Contracts\AirportCancellationSettingsServiceInterface;
use App\Settings\AirportCancellationSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/airport-cancellation-settings */
it('requires authentication to view airport cancellation settings', function () {
    $this->getJson('/api/v1/airport-cancellation-settings')
        ->assertUnauthorized();
});

it('returns airport cancellation settings with expected fields', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/airport-cancellation-settings')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('free_cancellation_hours')
        ->and($data)->toHaveKey('cancellation_fee_type')
        ->and($data)->toHaveKey('cancellation_fee_amount');
});

/* PUT /api/v1/airport-cancellation-settings */
it('requires authentication to update airport cancellation settings', function () {
    $this->putJson('/api/v1/airport-cancellation-settings', [])
        ->assertUnauthorized();
});

it('updates airport cancellation settings via the service', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/airport-cancellation-settings', [
            'free_cancellation_hours' => 48,
            'cancellation_fee_type' => 'flat',
            'cancellation_fee_amount' => 25.0,
        ])
        ->assertSuccessful();

    expect($response->json('data.free_cancellation_hours'))->toBe(48)
        ->and((float) $response->json('data.cancellation_fee_amount'))->toBe(25.0);
});

/* AirportCancellationSettingsService (service-level) */
it('getSettings returns the current settings as an array', function () {
    $settings = app(AirportCancellationSettings::class);
    $service = app(AirportCancellationSettingsServiceInterface::class);

    $data = $service->getSettings($settings);

    expect($data)->toBeArray()
        ->and($data)->toHaveKey('free_cancellation_hours');
});

it('updateSettings persists changes to the settings store', function () {
    $settings = app(AirportCancellationSettings::class);
    $service = app(AirportCancellationSettingsServiceInterface::class);

    $service->updateSettings($settings, [
        'cancellation_fee_type' => 'percentage',
        'cancellation_fee_amount' => 15.0,
    ]);

    $refreshed = app(AirportCancellationSettings::class);

    expect($refreshed->cancellation_fee_type)->toBe('percentage')
        ->and($refreshed->cancellation_fee_amount)->toBe(15.0);
});
