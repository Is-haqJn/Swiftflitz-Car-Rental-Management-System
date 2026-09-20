<?php

use App\Models\User;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers */

function seedReturnTimeSettings(?int $threshold = null): void
{
    $settings = app(RentalSettings::class);
    $settings->min_rental_days = 1;
    $settings->max_rental_days = 365;
    $settings->booking_advance_days = 0;
    $settings->require_license_verification = true;
    $settings->allow_public_booking = true;
    $settings->auto_confirm_bookings = false;
    $settings->overdue_check_hour = 8;
    $settings->return_reminder_hours_before = '24';
    $settings->allow_online_booking = true;
    $settings->booking_requires_confirmation = true;
    $settings->booking_grace_period_hours = 2;
    $settings->vat_enabled = false;
    $settings->vat_rate = 15.0;
    $settings->coupon_code_prefix = 'SF';
    $settings->pickup_window_start = '08:00';
    $settings->pickup_window_end = '20:00';
    $settings->return_time_threshold = $threshold;
    $settings->documents_required = false;
    $settings->save();
}

function makeAdminWithSettingsPermission(): User
{
    $user = User::factory()->create();
    $permission = Permission::firstOrCreate(['name' => 'settings.edit_rental', 'guard_name' => 'web']);
    $user->givePermissionTo($permission);

    return $user;
}

/* Public endpoint */

it('public rental-settings endpoint returns return_time_threshold as null when not configured', function () {
    seedReturnTimeSettings(null);

    $this->getJson('/api/v1/public/rental-settings')
        ->assertSuccessful()
        ->assertJsonPath('data.return_time_threshold', null);
});

it('public rental-settings endpoint returns return_time_threshold when configured', function () {
    seedReturnTimeSettings(2);

    $this->getJson('/api/v1/public/rental-settings')
        ->assertSuccessful()
        ->assertJsonPath('data.return_time_threshold', 2);
});

it('public rental-settings endpoint includes return_time_threshold key in response', function () {
    seedReturnTimeSettings();

    $this->getJson('/api/v1/public/rental-settings')
        ->assertSuccessful()
        ->assertJsonStructure(['data' => ['pickup_window_start', 'pickup_window_end', 'return_time_threshold']]);
});

/* Admin update */

it('admin can set return_time_threshold via rental settings update', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings(null);

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['return_time_threshold' => 3])
        ->assertSuccessful();

    expect(app(RentalSettings::class)->return_time_threshold)->toBe(3);
});

it('admin can clear return_time_threshold by sending null', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings(2);

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['return_time_threshold' => null])
        ->assertSuccessful();

    expect(app(RentalSettings::class)->return_time_threshold)->toBeNull();
});

/* Validation */

it('return_time_threshold must be at least 1', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings();

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['return_time_threshold' => 0])
        ->assertUnprocessable();
});

it('return_time_threshold cannot exceed 23', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings();

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['return_time_threshold' => 24])
        ->assertUnprocessable();
});

it('return_time_threshold must be an integer', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings();

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['return_time_threshold' => 'two'])
        ->assertUnprocessable();
});

it('updating rental settings without return_time_threshold does not change existing value', function () {
    $admin = makeAdminWithSettingsPermission();
    seedReturnTimeSettings(2);

    $this->actingAs($admin)
        ->putJson('/api/v1/settings/rental', ['pickup_window_start' => '09:00'])
        ->assertSuccessful();

    expect(app(RentalSettings::class)->return_time_threshold)->toBe(2);
});
