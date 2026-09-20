<?php

use App\Models\User;
use App\Services\Contracts\SystemServiceInterface;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* GET /api/v1/system/info */
it('requires authentication to view system info', function () {
    $this->getJson('/api/v1/system/info')
        ->assertUnauthorized();
});

it('returns system info with expected keys for an admin user', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/system/info')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('php_version')
        ->and($data)->toHaveKey('laravel_version')
        ->and($data)->toHaveKey('environment')
        ->and($data)->toHaveKey('database_driver')
        ->and($data)->toHaveKey('cache_driver');
});

/* SystemService::getInfo() (service-level) */
it('getInfo returns a populated array from the service', function () {
    $service = app(SystemServiceInterface::class);

    $info = $service->getInfo();

    expect($info['php_version'])->toBe(PHP_VERSION)
        ->and($info['laravel_version'])->toBe(app()->version())
        ->and($info['environment'])->not->toBeEmpty();
});

/* POST /api/v1/system/cache/clear */
it('requires authentication to clear cache', function () {
    $this->postJson('/api/v1/system/cache/clear')
        ->assertUnauthorized();
});

it('clears all caches and returns success for an admin user', function () {
    Role::create(['name' => 'super_admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('super_admin');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/system/cache/clear')
        ->assertSuccessful()
        ->assertJson(['message' => 'All caches cleared successfully.']);
});

/* POST /api/v1/system/maintenance-mode */
it('toggleMaintenanceMode enables maintenance mode and returns a bypass token', function () {
    $settings = app(GeneralSettings::class);
    $service = app(SystemServiceInterface::class);

    $result = $service->toggleMaintenanceMode(true, $settings);

    expect($result['enabled'])->toBeTrue()
        ->and($result['bypass_token'])->not->toBeNull();
});

it('toggleMaintenanceMode disables maintenance mode and clears the bypass token', function () {
    $settings = app(GeneralSettings::class);
    $service = app(SystemServiceInterface::class);

    // Enable first
    $service->toggleMaintenanceMode(true, $settings);

    // Then disable
    $result = $service->toggleMaintenanceMode(false, $settings);

    expect($result['enabled'])->toBeFalse()
        ->and($result['bypass_token'])->toBeNull();
});
