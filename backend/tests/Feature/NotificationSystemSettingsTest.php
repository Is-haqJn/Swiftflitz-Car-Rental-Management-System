<?php

use App\Models\User;
use App\Settings\NotificationSystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */
function notificationSettingsAdminUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('super_admin');
    $user->assignRole($role);

    return $user;
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedNotificationSystemSettings(array $overrides = []): void
{
    $settings = app(NotificationSystemSettings::class);

    $defaults = [
        'new_booking' => true,
        'return_reminder' => true,
        'overdue_alert' => true,
        'quote_request' => true,
        'vehicle_expiry' => true,
        'pickup_reminder' => true,
        'email_new_booking' => true,
        'email_return_reminder' => true,
        'email_overdue_alert' => true,
        'email_quote_request' => true,
        'email_vehicle_expiry' => true,
        'email_pickup_reminder' => true,
        'email_quote_confirmation' => true,
        'email_quote_ready' => true,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* GET /api/v1/settings/notifications */
it('requires authentication to view notification system settings', function () {
    $this->getJson('/api/v1/settings/notifications')
        ->assertUnauthorized();
});

it('can retrieve notification system settings', function () {
    $user = User::factory()->create();
    seedNotificationSystemSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/notifications')
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');

    $data = $response->json('data');

    expect($data)->toHaveKeys([
        'new_booking',
        'return_reminder',
        'overdue_alert',
        'quote_request',
        'vehicle_expiry',
        'pickup_reminder',
        'email_new_booking',
        'email_return_reminder',
        'email_overdue_alert',
        'email_quote_request',
        'email_vehicle_expiry',
        'email_pickup_reminder',
        'email_quote_confirmation',
        'email_quote_ready',
    ]);
});

it('returns current values for all notification system settings', function () {
    $user = User::factory()->create();
    seedNotificationSystemSettings(['new_booking' => false, 'email_overdue_alert' => false]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/notifications')
        ->assertSuccessful();

    expect($response->json('data.new_booking'))->toBeFalse();
    expect($response->json('data.email_overdue_alert'))->toBeFalse();
    expect($response->json('data.return_reminder'))->toBeTrue();
});

/* PUT /api/v1/settings/notifications */
it('requires authentication to update notification system settings', function () {
    $this->putJson('/api/v1/settings/notifications', [])
        ->assertUnauthorized();
});

it('can update notification system settings', function () {
    $user = notificationSettingsAdminUser();
    seedNotificationSystemSettings();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/notifications', [
            'new_booking' => false,
            'return_reminder' => true,
            'overdue_alert' => false,
            'quote_request' => true,
            'vehicle_expiry' => true,
            'pickup_reminder' => false,
            'email_new_booking' => false,
            'email_return_reminder' => true,
            'email_overdue_alert' => false,
            'email_quote_request' => true,
            'email_vehicle_expiry' => true,
            'email_pickup_reminder' => false,
        ])
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');

    $settings = app(NotificationSystemSettings::class);
    expect($settings->new_booking)->toBeFalse();
    expect($settings->overdue_alert)->toBeFalse();
    expect($settings->pickup_reminder)->toBeFalse();
    expect($settings->return_reminder)->toBeTrue();
    expect($settings->email_new_booking)->toBeFalse();
    expect($settings->email_return_reminder)->toBeTrue();
});

it('can toggle email_quote_ready for quote ready emails', function () {
    $user = notificationSettingsAdminUser();
    seedNotificationSystemSettings(['email_quote_ready' => true]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/notifications', ['email_quote_ready' => false])
        ->assertSuccessful();

    $settings = app(NotificationSystemSettings::class);
    expect($settings->email_quote_ready)->toBeFalse();
});

it('can toggle email_quote_confirmation for customer emails', function () {
    $user = notificationSettingsAdminUser();
    seedNotificationSystemSettings(['email_quote_confirmation' => true]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/notifications', ['email_quote_confirmation' => false])
        ->assertSuccessful();

    $settings = app(NotificationSystemSettings::class);
    expect($settings->email_quote_confirmation)->toBeFalse();
});

it('accepts partial updates using sometimes validation', function () {
    $user = notificationSettingsAdminUser();
    seedNotificationSystemSettings(['new_booking' => true, 'overdue_alert' => true]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/notifications', [
            'new_booking' => false,
        ])
        ->assertSuccessful();

    $settings = app(NotificationSystemSettings::class);
    expect($settings->new_booking)->toBeFalse();
    expect($settings->overdue_alert)->toBeTrue();
});

it('rejects non-boolean values for notification settings', function () {
    $user = notificationSettingsAdminUser();
    seedNotificationSystemSettings();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/notifications', [
            'new_booking' => 'yes',
        ])
        ->assertUnprocessable();
});
