<?php

use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Notifications\Channels\Sms\ArkesselSmsAdapter;
use App\Services\Notifications\Channels\Sms\NaloSmsAdapter;
use App\Services\Notifications\Channels\Sms\TwilioSmsAdapter;
use App\Services\Notifications\Channels\SmsChannel;
use App\Settings\NotificationSystemSettings;
use App\Settings\SmsSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * @param  array<string, mixed>  $overrides
 */
function seedSmsSettings(array $overrides = []): void
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
        'arkessel_api_key' => 'ark-test-key',
        'arkessel_sender_id' => 'Swiftflitz',
        'twilio_account_sid' => 'AC_test_sid',
        'twilio_auth_token' => 'test-auth-token',
        'twilio_from_number' => '+15550000001',
        'nalo_api_key' => 'nalo-test-key',
        'nalo_sender_id' => 'Swiftflitz',
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedNotificationSystemSettingsForSms(array $overrides = []): void
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
        'rental_status_change' => true,
        'email_rental_status_change' => true,
        'payment_confirmation' => true,
        'email_payment_confirmation' => true,
        'document_expiry_alert' => true,
        'email_document_expiry_alert' => true,
        'whatsapp_new_booking' => true,
        'whatsapp_return_reminder' => true,
        'whatsapp_overdue_alert' => true,
        'whatsapp_quote_request' => true,
        'whatsapp_vehicle_expiry' => true,
        'whatsapp_pickup_reminder' => true,
        'whatsapp_rental_status_change' => true,
        'whatsapp_payment_confirmation' => true,
        'whatsapp_document_expiry_alert' => true,
        'sms_new_booking' => true,
        'sms_return_reminder' => true,
        'sms_overdue_alert' => true,
        'sms_quote_request' => true,
        'sms_vehicle_expiry' => true,
        'sms_pickup_reminder' => true,
        'sms_rental_status_change' => true,
        'sms_payment_confirmation' => true,
        'sms_document_expiry_alert' => true,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* TwilioSmsAdapter */
it('twilio adapter makes correct http call', function () {
    Http::fake([
        'api.twilio.com/*' => Http::response(['sid' => 'SM_test_sid', 'status' => 'queued'], 201),
    ]);

    seedSmsSettings(['default_provider' => 'twilio']);

    $adapter = app(TwilioSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test SMS message');

    expect($result)->toBeTrue();

    Http::assertSent(fn ($request) => str_contains($request->url(), 'AC_test_sid/Messages.json')
        && $request['To'] === '+233200000001'
        && $request['Body'] === 'Test SMS message'
        && $request['From'] === '+15550000001');
});

it('twilio adapter returns false when api returns error', function () {
    Http::fake([
        'api.twilio.com/*' => Http::response(['code' => 20003, 'message' => 'Authenticate'], 401),
    ]);

    seedSmsSettings(['default_provider' => 'twilio']);

    $adapter = app(TwilioSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test message');

    expect($result)->toBeFalse();
});

it('twilio adapter isConfigured returns false when credentials are missing', function () {
    seedSmsSettings([
        'twilio_account_sid' => null,
        'twilio_auth_token' => null,
        'twilio_from_number' => null,
    ]);

    $adapter = app(TwilioSmsAdapter::class);

    expect($adapter->isConfigured())->toBeFalse();
});

/* ArkesselSmsAdapter */
it('arkessel adapter makes correct http call', function () {
    config(['services.sms.arkesel_base_url' => 'https://sms.arkesel.com/api/v2']);

    Http::fake([
        'sms.arkesel.com/*' => Http::response(['status' => 'success', 'data' => []], 200),
    ]);

    seedSmsSettings(['default_provider' => 'arkessel']);

    $adapter = app(ArkesselSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test SMS from Arkesel');

    expect($result)->toBeTrue();

    Http::assertSent(fn ($request) => str_contains($request->url(), 'sms.arkesel.com')
        && $request->header('api-key')[0] === 'ark-test-key'
        && $request['sender'] === 'Swiftflitz'
        && in_array('+233200000001', $request['recipients'])
        && $request['message'] === 'Test SMS from Arkesel');
});

it('arkessel adapter returns false when api returns error', function () {
    config(['services.sms.arkesel_base_url' => 'https://sms.arkesel.com/api/v2']);

    Http::fake([
        'sms.arkesel.com/*' => Http::response(['status' => 'error', 'message' => 'Invalid API key'], 401),
    ]);

    seedSmsSettings(['default_provider' => 'arkessel']);

    $adapter = app(ArkesselSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test message');

    expect($result)->toBeFalse();
});

it('arkessel adapter isConfigured returns false when credentials are missing', function () {
    seedSmsSettings([
        'arkessel_api_key' => null,
        'arkessel_sender_id' => null,
    ]);

    $adapter = app(ArkesselSmsAdapter::class);

    expect($adapter->isConfigured())->toBeFalse();
});

/* NaloSmsAdapter */
it('nalo adapter makes correct http call', function () {
    config(['services.sms.nalo_base_url' => 'https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo']);

    Http::fake([
        'sms.nalosolutions.com/*' => Http::response('1701|233200000001|api.0000011.20220418.0000001', 200),
    ]);

    seedSmsSettings(['default_provider' => 'nalo']);

    $adapter = app(NaloSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test SMS from Nalo');

    expect($result)->toBeTrue();

    Http::assertSent(function ($request) {
        parse_str(parse_url($request->url(), PHP_URL_QUERY), $params);

        return str_contains($request->url(), 'nalosolutions.com')
            && ($params['key'] ?? null) === 'nalo-test-key'
            && ($params['source'] ?? null) === 'Swiftflitz'
            && ($params['destination'] ?? null) === '+233200000001'
            && ($params['message'] ?? null) === 'Test SMS from Nalo';
    });
});

it('nalo adapter returns false when api returns error', function () {
    config(['services.sms.nalo_base_url' => 'https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo']);

    Http::fake([
        'sms.nalosolutions.com/*' => Http::response('1706|Invalid Key', 200),
    ]);

    seedSmsSettings(['default_provider' => 'nalo']);

    $adapter = app(NaloSmsAdapter::class);
    $result = $adapter->send('+233200000001', 'Test message');

    expect($result)->toBeFalse();
});

it('nalo adapter isConfigured returns false when credentials are missing', function () {
    seedSmsSettings([
        'nalo_api_key' => null,
        'nalo_sender_id' => null,
    ]);

    $adapter = app(NaloSmsAdapter::class);

    expect($adapter->isConfigured())->toBeFalse();
});

/* SmsChannel */
it('sms channel delegates to twilio when default provider is twilio', function () {
    Http::fake([
        'api.twilio.com/*' => Http::response(['sid' => 'SM_abc', 'status' => 'queued'], 201),
    ]);

    seedSmsSettings(['default_provider' => 'twilio']);

    $channel = app(SmsChannel::class);
    $result = $channel->send('+233200000001', 'Hello via Twilio');

    expect($result)->toBeTrue();
    Http::assertSent(fn ($request) => str_contains($request->url(), 'twilio.com'));
});

it('sms channel delegates to arkessel when default provider is arkessel', function () {
    config(['services.sms.arkesel_base_url' => 'https://sms.arkesel.com/api/v2']);

    Http::fake([
        'sms.arkesel.com/*' => Http::response(['status' => 'success'], 200),
    ]);

    seedSmsSettings(['default_provider' => 'arkessel']);

    $channel = app(SmsChannel::class);
    $result = $channel->send('+233200000001', 'Hello via Arkesel');

    expect($result)->toBeTrue();
    Http::assertSent(fn ($request) => str_contains($request->url(), 'sms.arkesel.com'));
});

it('sms channel returns false when disabled', function () {
    seedSmsSettings(['enabled' => false]);

    $channel = app(SmsChannel::class);
    $result = $channel->send('+233200000001', 'Should not send');

    expect($result)->toBeFalse();
    Http::assertNothingSent();
});

/* shouldSend() logic */
it('shouldSend returns false when sms is disabled globally', function () {
    seedSmsSettings(['enabled' => false]);
    seedNotificationSystemSettingsForSms();

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns false when per-type toggle is off in sms settings', function () {
    seedSmsSettings(['send_new_booking' => false]);
    seedNotificationSystemSettingsForSms();

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns false when system-level sms toggle is off', function () {
    seedSmsSettings();
    seedNotificationSystemSettingsForSms(['sms_new_booking' => false]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns true when all toggles are on', function () {
    seedSmsSettings();
    seedNotificationSystemSettingsForSms();

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeTrue();
});

/* resolveRecipient() - delivery modes */
it('routes to test phone number when test mode is on', function () {
    seedSmsSettings([
        'test_mode' => true,
        'test_phone_number' => '+233299999999',
    ]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233299999999');
});

it('test mode takes priority over admin only mode', function () {
    seedSmsSettings([
        'test_mode' => true,
        'test_phone_number' => '+233299999999',
        'admin_only_mode' => true,
        'admin_phone_number' => '+233288888888',
    ]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233299999999');
});

it('routes to admin_only_phone_number when admin only mode is on', function () {
    seedSmsSettings([
        'admin_only_mode' => true,
        'admin_only_phone_number' => '+233288888888',
    ]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233288888888');
});

it('suppresses customer sms when notify customers is off', function () {
    seedSmsSettings(['notify_customers' => false]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBeNull();
});

it('allows customer sms when notify customers is on', function () {
    seedSmsSettings(['notify_customers' => true]);

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233200000001');
});

it('returns the original phone in normal mode', function () {
    seedSmsSettings();

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: false))
        ->toBe('+233200000001');
});

it('returns null when phone is null in normal mode', function () {
    seedSmsSettings();

    $service = app(SmsNotificationServiceInterface::class);

    expect($service->resolveRecipient(null, isCustomer: false))
        ->toBeNull();
});
