<?php

use App\Models\SmsTemplate;
use App\Models\User;
use App\Services\Notifications\Channels\Sms\HubtelSmsAdapter;
use App\Services\Notifications\Channels\SmsChannel;
use App\Settings\GeneralSettings;
use App\Settings\SmsSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helper: create a user with settings.edit_sms permission */
function userWithSmsPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_sms', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_sms');

    return $user;
}

/* Helper: create a user with settings.test_sms permission */
function userWithTestSmsPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.test_sms', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.test_sms');

    return $user;
}

/* Helper: seed SMS settings */
function seedSmsSettingsForTest(array $overrides = []): void
{
    $settings = app(SmsSettings::class);

    $defaults = [
        'enabled' => true,
        'default_provider' => 'twilio',
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
        'twilio_account_sid' => 'AC_test_sid',
        'twilio_auth_token' => 'test-token',
        'twilio_from_number' => '+15550000001',
        'arkessel_api_key' => '',
        'arkessel_sender_id' => '',
        'nalo_api_key' => '',
        'nalo_sender_id' => '',
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* PUT /api/v1/settings/sms */

it('requires authentication to update sms settings', function () {
    $this->putJson('/api/v1/settings/sms', ['enabled' => false])
        ->assertStatus(401);
});

it('cannot update sms settings without edit_sms permission', function () {
    $user = User::factory()->create();
    seedSmsSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['enabled' => false])
        ->assertStatus(403);
});

it('can update sms settings with edit_sms permission', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['enabled' => true]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['enabled' => false])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->enabled)->toBeFalse();
});

it('can update sms settings as super_admin', function () {
    seedSmsSettingsForTest(['default_provider' => 'twilio']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/sms', ['default_provider' => 'arkessel'])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->default_provider)->toBe('arkessel');
});

it('does not overwrite credentials when mask placeholder is submitted', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['arkessel_api_key' => 'real-api-key-123']);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['arkessel_api_key' => '••••••••••••••••'])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->arkessel_api_key)->toBe('real-api-key-123');
});

/* PUT /api/v1/settings/sms/test */

it('requires authentication to send a test sms', function () {
    $this->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(401);
});

it('cannot send a test sms without test_sms permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(403);
});

it('validates the phone number format', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => 'not-a-phone'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

it('validates that phone is required', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

it('accepts local phone number format', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')->once()->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '0551234567'])
        ->assertStatus(200);
});

it('accepts international phone number format', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')->once()->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(200);
});

it('can send a test sms with test_sms permission', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')
        ->once()
        ->with('+233551234567', Mockery::type('string'))
        ->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(200)
        ->assertJsonPath('message', 'Test SMS sent successfully.');
});

it('returns 422 when sms channel cannot send', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')->once()->andReturn(false);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(422);
});

it('can send a test sms as super_admin', function () {
    seedSmsSettingsForTest();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')->once()->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '0551234567'])
        ->assertStatus(200);
});

it('does not overwrite hubtel_sms_client_secret when mask placeholder is submitted', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest();
    $settings = app(SmsSettings::class);
    $settings->hubtel_sms_client_secret = 'real-hubtel-secret';
    $settings->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['hubtel_sms_client_secret' => '••••••••••••••••'])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->hubtel_sms_client_secret)->toBe('real-hubtel-secret');
});

it('hubtel sms adapter sends message when configured', function () {
    Http::fake(['https://sms.hubtel.com/*' => Http::response(['status' => 0, 'statusDescription' => 'request submitted successfully'], 201)]);

    $settings = app(SmsSettings::class);
    $settings->hubtel_sms_client_id = 'test-client-id';
    $settings->hubtel_sms_client_secret = 'test-client-secret';
    $settings->hubtel_sms_sender_id = 'TestSender';
    $settings->save();

    $adapter = app(HubtelSmsAdapter::class);

    expect($adapter->send('+233551234567', 'Hello'))->toBeTrue();
});

it('hubtel sms adapter returns false when not configured', function () {
    $settings = app(SmsSettings::class);
    $settings->hubtel_sms_client_id = null;
    $settings->hubtel_sms_client_secret = null;
    $settings->hubtel_sms_sender_id = null;
    $settings->save();

    $adapter = app(HubtelSmsAdapter::class);

    expect($adapter->isConfigured())->toBeFalse();
    expect($adapter->send('+233551234567', 'Hello'))->toBeFalse();
});

it('hubtel sms adapter getName returns hubtel', function () {
    $adapter = app(HubtelSmsAdapter::class);

    expect($adapter->getName())->toBe('hubtel');
});

it('test sms message includes the configured site name', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $generalSettings = app(GeneralSettings::class);
    $generalSettings->site_name = 'AcmeRentals';
    $generalSettings->save();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')
        ->once()
        ->with('+233551234567', Mockery::on(fn ($msg) => str_contains($msg, 'AcmeRentals')))
        ->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(200);
});

it('test sms sends type-specific message when type is provided', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $generalSettings = app(GeneralSettings::class);
    $generalSettings->site_name = 'Swiftflitz';
    $generalSettings->save();

    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')
        ->once()
        ->with('+233551234567', Mockery::on(fn ($msg) => str_contains($msg, 'booking') || str_contains($msg, 'Booking')))
        ->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567', 'type' => 'new_booking'])
        ->assertStatus(200);
});

it('test sms uses defined template body when template exists in db', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    SmsTemplate::create([
        'key' => 'new_booking',
        'name' => 'New Booking',
        'body' => 'Hello {{customer_name}}, your booking {{booking_reference}} is confirmed.',
        'default_body' => 'Hello {{customer_name}}, your booking {{booking_reference}} is confirmed.',
    ]);

    $capturedMessage = null;
    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')
        ->once()
        ->with('+233551234567', Mockery::on(function ($msg) use (&$capturedMessage) {
            $capturedMessage = $msg;

            return true;
        }))
        ->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567', 'type' => 'new_booking'])
        ->assertStatus(200);

    /* Template variables must be replaced with sample data */
    expect($capturedMessage)
        ->toContain('John Doe')
        ->toContain('REF-TEST001');
});

it('test sms falls back to embedded string when template is not in db', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    /* No template seeded - fallback should apply */
    $mockChannel = Mockery::mock(SmsChannel::class);
    $mockChannel->shouldReceive('send')
        ->once()
        ->with('+233551234567', Mockery::type('string'))
        ->andReturn(true);
    app()->instance(SmsChannel::class, $mockChannel);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567', 'type' => 'new_booking'])
        ->assertStatus(200);
});

it('test sms validates type against allowed values', function () {
    $user = userWithTestSmsPermission();
    seedSmsSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567', 'type' => 'invalid_type'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['type']);
});

it('cannot send test sms but can still update settings with only edit_sms permission', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['enabled' => true]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/sms/test', ['phone' => '+233551234567'])
        ->assertStatus(403);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['enabled' => false])
        ->assertStatus(200);
});

/* Toggle fields that were previously missing from validation rules */

it('can save send_rental_status_change toggle', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['send_rental_status_change' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['send_rental_status_change' => true])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->send_rental_status_change)->toBeTrue();
});

it('can save send_vehicle_expiry toggle', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['send_vehicle_expiry' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['send_vehicle_expiry' => true])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->send_vehicle_expiry)->toBeTrue();
});

it('can save send_quote_request toggle', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['send_quote_request' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['send_quote_request' => true])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->send_quote_request)->toBeTrue();
});

it('can save send_document_expiry_alert toggle', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest(['send_document_expiry_alert' => false]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', ['send_document_expiry_alert' => true])
        ->assertStatus(200);

    expect(app(SmsSettings::class)->send_document_expiry_alert)->toBeTrue();
});

it('can set hubtel as default sms provider', function () {
    $user = userWithSmsPermission();
    seedSmsSettingsForTest();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', [
            'default_provider' => 'hubtel',
            'hubtel_sms_client_id' => 'hubtel-client-id',
            'hubtel_sms_sender_id' => 'Swiftflitz',
        ])
        ->assertStatus(200);

    $settings = app(SmsSettings::class);
    expect($settings->default_provider)->toBe('hubtel')
        ->and($settings->hubtel_sms_client_id)->toBe('hubtel-client-id')
        ->and($settings->hubtel_sms_sender_id)->toBe('Swiftflitz');
});
