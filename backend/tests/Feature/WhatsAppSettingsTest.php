<?php

use App\Models\User;
use App\Services\Notifications\Channels\WhatsAppChannel;
use App\Settings\WhatsAppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helper: create a user with settings.edit_whatsapp permission */
function userWithWhatsAppPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_whatsapp', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_whatsapp');

    return $user;
}

/* Helper: create a user with settings.test_whatsapp permission */
function userWithTestWhatsAppPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.test_whatsapp', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.test_whatsapp');

    return $user;
}

/* Helper: seed WhatsApp settings */
function seedWhatsAppSettingsForTest(array $overrides = []): void
{
    $settings = app(WhatsAppSettings::class);

    $defaults = [
        'enabled' => true,
        'access_token' => 'test-access-token',
        'phone_number_id' => '123456789',
        'business_account_id' => '987654321',
        'test_mode' => false,
        'test_phone_number' => null,
        'admin_only_mode' => false,
        'admin_phone_number' => null,
        'notify_customers' => true,
        'send_new_booking' => true,
        'send_return_reminder' => true,
        'send_overdue_alert' => true,
        'send_pickup_reminder' => true,
        'send_payment_confirmation' => true,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* POST /api/v1/settings/whatsapp/test */

it('requires authentication to send a test whatsapp message', function () {
    $this->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(401);
});

it('cannot send a test whatsapp message without test_whatsapp permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(403);
});

it('validates the phone number format for whatsapp test', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => 'not-a-phone'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

it('validates that phone is required for whatsapp test', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

it('accepts local phone number format for whatsapp test', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')->once()->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '0551234567'])
        ->assertStatus(200);
});

it('accepts international phone number format for whatsapp test', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')->once()->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(200);
});

it('can send a test whatsapp message with test_whatsapp permission', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')
        ->once()
        ->with('+233551234567', 'hello_world', Mockery::any(), Mockery::any())
        ->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Test WhatsApp message sent successfully.');
});

it('returns 422 when whatsapp channel cannot send', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')->once()->andReturn(false);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(422);
});

it('can send a test whatsapp message as super_admin', function () {
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')->once()->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '0551234567'])
        ->assertStatus(200);
});

it('test whatsapp uses hello_world template by default', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')
        ->once()
        ->with('+233551234567', 'hello_world', Mockery::any(), Mockery::any())
        ->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(200);
});

it('test whatsapp sends event-specific template when type is provided', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $mockChannel = Mockery::mock(WhatsAppChannel::class);
    $mockChannel->shouldReceive('sendTemplate')
        ->once()
        ->with('+233551234567', Mockery::type('string'), Mockery::any(), Mockery::any())
        ->andReturn(true);
    app()->instance(WhatsAppChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567', 'type' => 'new_booking'])
        ->assertStatus(200);
});

it('test whatsapp validates type against allowed values', function () {
    $user = userWithTestWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567', 'type' => 'invalid_type'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['type']);
});

it('cannot send test whatsapp but can still update settings with only edit_whatsapp permission', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest(['notify_customers' => true]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/whatsapp/test', ['phone' => '+233551234567'])
        ->assertStatus(403);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['notify_customers' => false])
        ->assertStatus(200);
});

/* Toggle fields that were previously missing from validation rules */

it('can save send_rental_status_change whatsapp toggle', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest(['send_rental_status_change' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['send_rental_status_change' => true])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->send_rental_status_change)->toBeTrue();
});

it('can save send_vehicle_expiry whatsapp toggle', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest(['send_vehicle_expiry' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['send_vehicle_expiry' => true])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->send_vehicle_expiry)->toBeTrue();
});

it('can save send_quote_request whatsapp toggle', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest(['send_quote_request' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['send_quote_request' => true])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->send_quote_request)->toBeTrue();
});

it('can save send_document_expiry_alert whatsapp toggle', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest(['send_document_expiry_alert' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['send_document_expiry_alert' => true])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->send_document_expiry_alert)->toBeTrue();
});

/* app_secret and webhook_verify_token */

it('masks app_secret on get whatsapp settings', function () {
    $settings = app(WhatsAppSettings::class);
    $settings->app_secret = 'my-real-app-secret';
    $settings->save();

    seedWhatsAppSettingsForTest();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/settings/whatsapp')
        ->assertOk()
        ->assertJsonPath('data.app_secret', '••••••••••••••••');
});

it('saving masked app_secret does not overwrite the real value', function () {
    $user = userWithWhatsAppPermission();

    $settings = app(WhatsAppSettings::class);
    $settings->app_secret = 'original-secret';
    $settings->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['app_secret' => '••••••••••••••••'])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->app_secret)->toBe('original-secret');
});

it('can save and retrieve webhook_verify_token', function () {
    $user = userWithWhatsAppPermission();
    seedWhatsAppSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', ['webhook_verify_token' => 'my-custom-token'])
        ->assertStatus(200);

    expect(app(WhatsAppSettings::class)->webhook_verify_token)->toBe('my-custom-token');
});
