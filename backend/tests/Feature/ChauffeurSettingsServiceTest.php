<?php

use App\Models\User;
use App\Services\Contracts\ChauffeurSettingsServiceInterface;
use App\Settings\ChauffeurSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/chauffeur-settings */
it('requires authentication to view chauffeur settings', function () {
    $this->getJson('/api/v1/chauffeur-settings')
        ->assertUnauthorized();
});

it('returns all chauffeur setting fields for an admin user', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/chauffeur-settings')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('grace_period_minutes')
        ->and($data)->toHaveKey('cancellation_flat_fee')
        ->and($data)->toHaveKey('overtime_charge_per_hour')
        ->and($data)->toHaveKey('booking_window_start')
        ->and($data)->toHaveKey('booking_window_end');
});

/* PUT /api/v1/chauffeur-settings */
it('requires authentication to update chauffeur settings', function () {
    $this->putJson('/api/v1/chauffeur-settings', [])
        ->assertUnauthorized();
});

it('updates chauffeur settings via the service', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/chauffeur-settings', [
            'grace_period_minutes' => 30,
            'no_show_fee' => 50.0,
        ])
        ->assertSuccessful();

    expect($response->json('data.grace_period_minutes'))->toBe(30)
        ->and((float) $response->json('data.no_show_fee'))->toBe(50.0);
});

/* ChauffeurSettingsService (service-level) */
it('getSettings returns the full settings array', function () {
    $settings = app(ChauffeurSettings::class);
    $service = app(ChauffeurSettingsServiceInterface::class);

    $data = $service->getSettings($settings);

    expect($data)->toBeArray()
        ->and($data)->toHaveKey('grace_period_minutes')
        ->and($data)->toHaveKey('booking_window_start');
});

it('getPublicSettings returns only booking window fields', function () {
    $settings = app(ChauffeurSettings::class);
    $service = app(ChauffeurSettingsServiceInterface::class);

    $data = $service->getPublicSettings($settings);

    expect($data)->toHaveKey('booking_window_start')
        ->and($data)->toHaveKey('booking_window_end')
        ->and($data)->not->toHaveKey('no_show_fee')
        ->and($data)->not->toHaveKey('overtime_charge_per_hour');
});

it('updateSettings persists changes to the settings store', function () {
    $settings = app(ChauffeurSettings::class);
    $service = app(ChauffeurSettingsServiceInterface::class);

    $service->updateSettings($settings, ['grace_period_minutes' => 45]);

    $refreshed = app(ChauffeurSettings::class);

    expect($refreshed->grace_period_minutes)->toBe(45);
});
