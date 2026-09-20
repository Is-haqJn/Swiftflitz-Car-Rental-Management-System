<?php

use App\Models\Customer;
use App\Models\Rental;
use App\Models\SmsTemplate;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WhatsAppTemplate;
use App\Services\Notifications\SmsNotificationService;
use App\Services\Notifications\WhatsAppNotificationService;
use App\Settings\NotificationSystemSettings;
use App\Settings\SmsSettings;
use App\Settings\WhatsAppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function waSettings(array $overrides = []): WhatsAppSettings
{
    $settings = app(WhatsAppSettings::class);
    $defaults = [
        'enabled' => true,
        'access_token' => 'test-token',
        'phone_number_id' => '123',
        'business_account_id' => '456',
        'test_mode' => false,
        'test_phone_number' => '+0000000001',
        'admin_only_mode' => false,
        'admin_phone_number' => '+9000000000',
        'admin_only_phone_number' => null,
        'mirror_mode' => false,
        'notify_customers' => true,
        'send_new_booking' => true,
    ];
    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }
    $settings->save();

    return $settings;
}

function smsSettings(array $overrides = []): SmsSettings
{
    $settings = app(SmsSettings::class);
    $defaults = [
        'enabled' => true,
        'default_provider' => 'arkessel',
        'test_mode' => false,
        'test_phone_number' => '+0000000001',
        'admin_only_mode' => false,
        'admin_phone_number' => '+9000000000',
        'admin_only_phone_number' => null,
        'mirror_mode' => false,
        'notify_customers' => true,
        'send_new_booking' => true,
        'arkessel_api_key' => 'test-key',
        'arkessel_sender_id' => 'TEST',
    ];
    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }
    $settings->save();

    return $settings;
}

/* resolveRecipient() - separate phone number routing */

it('WhatsApp resolveRecipient returns admin_only_phone_number when admin_only_mode on', function () {
    waSettings([
        'admin_only_mode' => true,
        'admin_phone_number' => '+9000000000',
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(WhatsAppNotificationService::class);

    expect($service->resolveRecipient('+1234567890', isCustomer: true))->toBe('+5551112222');
});

it('WhatsApp resolveRecipient does not use admin_phone_number for customer routing in admin_only_mode', function () {
    waSettings([
        'admin_only_mode' => true,
        'admin_phone_number' => '+9000000000',
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(WhatsAppNotificationService::class);
    $result = $service->resolveRecipient('+1234567890', isCustomer: true);

    expect($result)->not->toBe('+9000000000');
    expect($result)->not->toBe('+1234567890');
});

it('WhatsApp resolveRecipient returns customer phone normally when admin_only_mode off', function () {
    waSettings([
        'admin_only_mode' => false,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(WhatsAppNotificationService::class);

    expect($service->resolveRecipient('+1234567890', isCustomer: true))->toBe('+1234567890');
});

it('WhatsApp resolveRecipient returns customer phone when admin_only_mode on and mirror_mode on', function () {
    waSettings([
        'admin_only_mode' => true,
        'mirror_mode' => true,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(WhatsAppNotificationService::class);

    expect($service->resolveRecipient('+1234567890', isCustomer: true))->toBe('+1234567890');
});

it('SMS resolveRecipient returns admin_only_phone_number when admin_only_mode on', function () {
    smsSettings([
        'admin_only_mode' => true,
        'admin_phone_number' => '+9000000000',
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(SmsNotificationService::class);

    expect($service->resolveRecipient('+1234567890', isCustomer: true))->toBe('+5551112222');
});

it('SMS resolveRecipient returns customer phone normally when admin_only_mode off', function () {
    smsSettings([
        'admin_only_mode' => false,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $service = app(SmsNotificationService::class);

    expect($service->resolveRecipient('+1234567890', isCustomer: true))->toBe('+1234567890');
});

/* mirror_mode - integration with HTTP */

it('WhatsApp admin_only + mirror sends to both customer and admin_only_phone_number', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.abc']]], 200)]);

    waSettings([
        'admin_only_mode' => true,
        'mirror_mode' => true,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $systemSettings = app(NotificationSystemSettings::class);
    $systemSettings->new_booking = true;
    $systemSettings->whatsapp_new_booking = true;
    $systemSettings->save();

    WhatsAppTemplate::create([
        'key' => 'new_booking',
        'name' => 'New Booking',
        'template_name' => 'new_booking',
        'header' => '',
        'body' => 'Hello {{1}}, your booking {{2}} is confirmed.',
        'footer' => '',
        'language_code' => 'en',
        'variables' => ['customer_name', 'booking_reference'],
        'default_template_name' => 'new_booking',
        'default_header' => '',
        'default_body' => 'Hello {{1}}, your booking {{2}} is confirmed.',
        'default_footer' => '',
    ]);

    $customer = Customer::factory()->create(['phone' => '+1234567890']);
    $vehicle = Vehicle::factory()->create();
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'reference' => 'RNT-MIRROR-001',
    ]);

    app(WhatsAppNotificationService::class)->notifyNewBooking($rental);

    Http::assertSent(fn ($request) => $request->data()['to'] === '+1234567890');
    Http::assertSent(fn ($request) => $request->data()['to'] === '+5551112222');
    Http::assertSentCount(2);
});

it('WhatsApp admin_only without mirror sends only to admin_only_phone_number', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.abc']]], 200)]);

    waSettings([
        'admin_only_mode' => true,
        'mirror_mode' => false,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $systemSettings = app(NotificationSystemSettings::class);
    $systemSettings->new_booking = true;
    $systemSettings->whatsapp_new_booking = true;
    $systemSettings->save();

    WhatsAppTemplate::create([
        'key' => 'new_booking',
        'name' => 'New Booking',
        'template_name' => 'new_booking',
        'header' => '',
        'body' => 'Hello {{1}}, your booking {{2}} is confirmed.',
        'footer' => '',
        'language_code' => 'en',
        'variables' => ['customer_name', 'booking_reference'],
        'default_template_name' => 'new_booking',
        'default_header' => '',
        'default_body' => 'Hello {{1}}, your booking {{2}} is confirmed.',
        'default_footer' => '',
    ]);

    $customer = Customer::factory()->create(['phone' => '+1234567890']);
    $vehicle = Vehicle::factory()->create();
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'reference' => 'RNT-MIRROR-002',
    ]);

    app(WhatsAppNotificationService::class)->notifyNewBooking($rental);

    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => $request->data()['to'] === '+5551112222');
    Http::assertNotSent(fn ($request) => ($request->data()['to'] ?? '') === '+1234567890');
});

it('SMS admin_only + mirror sends to both customer and admin_only_phone_number', function () {
    Http::fake(['sms.arkesel.com/*' => Http::response(['status' => 'success'], 200)]);

    smsSettings([
        'admin_only_mode' => true,
        'mirror_mode' => true,
        'admin_only_phone_number' => '+5551112222',
    ]);

    $systemSettings = app(NotificationSystemSettings::class);
    $systemSettings->new_booking = true;
    $systemSettings->sms_new_booking = true;
    $systemSettings->save();

    SmsTemplate::create([
        'key' => 'new_booking',
        'name' => 'New Booking',
        'body' => 'Hello {{customer_name}}, your booking {{booking_reference}} is confirmed.',
        'default_body' => 'Hello {{customer_name}}, your booking {{booking_reference}} is confirmed.',
    ]);

    $customer = Customer::factory()->create(['phone' => '+1234567890']);
    $vehicle = Vehicle::factory()->create();
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'vehicle_id' => $vehicle->id,
        'reference' => 'RNT-SMS-MIRROR-001',
    ]);

    app(SmsNotificationService::class)->notifyNewBooking($rental);

    Http::assertSent(fn ($request) => in_array('+1234567890', $request->data()['recipients'] ?? []));
    Http::assertSent(fn ($request) => in_array('+5551112222', $request->data()['recipients'] ?? []));
    Http::assertSentCount(2);
});

/* Settings persistence */

it('persists admin_only_phone_number and mirror_mode in WhatsApp settings via API', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_whatsapp', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_whatsapp');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', [
            'admin_only_phone_number' => '+5559876543',
            'mirror_mode' => true,
        ]);

    $response->assertOk();

    $settings = app(WhatsAppSettings::class);
    expect($settings->admin_only_phone_number)->toBe('+5559876543');
    expect($settings->mirror_mode)->toBeTrue();
});

it('persists admin_only_phone_number and mirror_mode in SMS settings via API', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_sms', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_sms');

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/sms', [
            'admin_only_phone_number' => '+5559876543',
            'mirror_mode' => true,
        ]);

    $response->assertOk();

    $settings = app(SmsSettings::class);
    expect($settings->admin_only_phone_number)->toBe('+5559876543');
    expect($settings->mirror_mode)->toBeTrue();
});
