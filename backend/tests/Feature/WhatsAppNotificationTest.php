<?php

use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Notifications\Channels\WhatsAppChannel;
use App\Settings\NotificationSystemSettings;
use App\Settings\WhatsAppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * @param  array<string, mixed>  $overrides
 */
function seedWhatsAppSettingsForNotification(array $overrides = []): void
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

/**
 * @param  array<string, mixed>  $overrides
 */
function seedNotificationSystemSettingsForWhatsApp(array $overrides = []): void
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
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* WhatsAppChannel::send() */
it('makes the correct http call to meta api when sending', function () {
    Http::fake([
        'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.abc']]], 200),
    ]);

    seedWhatsAppSettingsForNotification();

    $channel = app(WhatsAppChannel::class);
    $result = $channel->send('+233200000001', 'Test message');

    expect($result)->toBeTrue();

    Http::assertSent(fn ($request) => str_contains($request->url(), '123456789/messages')
        && $request->header('Authorization')[0] === 'Bearer test-access-token'
        && $request->data()['to'] === '+233200000001'
        && $request->data()['type'] === 'text'
        && $request->data()['text']['body'] === 'Test message'
        && $request->data()['messaging_product'] === 'whatsapp');
});

it('returns false when meta api returns an error', function () {
    Http::fake([
        'graph.facebook.com/*' => Http::response(['error' => ['message' => 'Invalid token']], 401),
    ]);

    seedWhatsAppSettingsForNotification();

    $channel = app(WhatsAppChannel::class);
    $result = $channel->send('+233200000001', 'Test message');

    expect($result)->toBeFalse();
});

/* shouldSend() logic */
it('shouldSend returns false when whatsapp is disabled globally', function () {
    seedWhatsAppSettingsForNotification(['enabled' => false]);
    seedNotificationSystemSettingsForWhatsApp();

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns false when per-type toggle is off in whatsapp settings', function () {
    seedWhatsAppSettingsForNotification(['send_new_booking' => false]);
    seedNotificationSystemSettingsForWhatsApp();

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns false when system-level whatsapp toggle is off', function () {
    seedWhatsAppSettingsForNotification();
    seedNotificationSystemSettingsForWhatsApp(['whatsapp_new_booking' => false]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeFalse();
});

it('shouldSend returns true when all toggles are on', function () {
    seedWhatsAppSettingsForNotification();
    seedNotificationSystemSettingsForWhatsApp();

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->shouldSend('new_booking'))->toBeTrue();
});

/* resolveRecipient() - delivery modes */
it('routes to test phone number when test mode is on', function () {
    seedWhatsAppSettingsForNotification([
        'test_mode' => true,
        'test_phone_number' => '+233299999999',
    ]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233299999999');
});

it('test mode takes priority over admin only mode', function () {
    seedWhatsAppSettingsForNotification([
        'test_mode' => true,
        'test_phone_number' => '+233299999999',
        'admin_only_mode' => true,
        'admin_phone_number' => '+233288888888',
    ]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233299999999');
});

it('routes to admin_only_phone_number when admin only mode is on', function () {
    seedWhatsAppSettingsForNotification([
        'admin_only_mode' => true,
        'admin_only_phone_number' => '+233288888888',
    ]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233288888888');
});

it('suppresses customer messages when notify customers is off', function () {
    seedWhatsAppSettingsForNotification(['notify_customers' => false]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBeNull();
});

it('allows customer messages when notify customers is on', function () {
    seedWhatsAppSettingsForNotification(['notify_customers' => true]);

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: true))
        ->toBe('+233200000001');
});

it('returns the original phone in normal mode when notify customers is on', function () {
    seedWhatsAppSettingsForNotification();

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient('+233200000001', isCustomer: false))
        ->toBe('+233200000001');
});

it('returns null when phone is null in normal mode', function () {
    seedWhatsAppSettingsForNotification();

    $service = app(WhatsAppNotificationServiceInterface::class);

    expect($service->resolveRecipient(null, isCustomer: false))
        ->toBeNull();
});
