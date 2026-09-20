<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * PHP converts dots to underscores in URL query string keys, so Meta's
 * hub.mode, hub.verify_token, hub.challenge become hub_mode, hub_verify_token,
 * hub_challenge once parsed by PHP. The controller reads them with underscores.
 */

/* GET /api/v1/webhooks/whatsapp (hub verification) */
it('returns the hub challenge when verify token matches', function () {
    config(['services.whatsapp.verify_token' => 'my-secret-token']);

    $this->get('/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=challenge-abc-123')
        ->assertOk()
        ->assertSee('challenge-abc-123');
});

it('returns 403 when the verify token does not match', function () {
    config(['services.whatsapp.verify_token' => 'correct-token']);

    $this->get('/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge-abc-123')
        ->assertForbidden();
});

it('returns 403 when hub mode is not subscribe', function () {
    config(['services.whatsapp.verify_token' => 'my-secret-token']);

    $this->get('/api/v1/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=my-secret-token&hub.challenge=challenge-abc-123')
        ->assertForbidden();
});

/* POST /api/v1/webhooks/whatsapp (incoming messages) */
it('always returns 200 for incoming webhook payloads with valid signature', function () {
    config(['services.whatsapp.app_secret' => 'test-app-secret']);

    $payload = json_encode([
        'object' => 'whatsapp_business_account',
        'entry' => [],
    ]);

    $signature = 'sha256=' . hash_hmac('sha256', $payload, 'test-app-secret');

    $this->call('POST', '/api/v1/webhooks/whatsapp', [], [], [], [
        'HTTP_X_HUB_SIGNATURE_256' => $signature,
        'CONTENT_TYPE' => 'application/json',
    ], $payload)
        ->assertOk();
});

it('returns 403 when webhook signature is invalid', function () {
    config(['services.whatsapp.app_secret' => 'test-app-secret']);

    $this->call('POST', '/api/v1/webhooks/whatsapp', [], [], [], [
        'HTTP_X_HUB_SIGNATURE_256' => 'sha256=invalid-signature',
        'CONTENT_TYPE' => 'application/json',
    ], json_encode(['object' => 'whatsapp_business_account']))
        ->assertForbidden();
});

it('returns 200 when app secret is not configured', function () {
    config(['services.whatsapp.app_secret' => '']);

    $this->postJson('/api/v1/webhooks/whatsapp', ['object' => 'whatsapp_business_account'])
        ->assertOk();
});

/* DB-based credentials */

it('uses webhook_verify_token from db settings when env is empty', function () {
    config(['services.whatsapp.verify_token' => '']);

    $settings = app(\App\Settings\WhatsAppSettings::class);
    $settings->webhook_verify_token = 'db-stored-verify-token';
    $settings->save();

    $this->get('/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=db-stored-verify-token&hub.challenge=ch-xyz')
        ->assertOk()
        ->assertSee('ch-xyz');
});

it('uses app_secret from db settings when env is empty for signature verification', function () {
    config(['services.whatsapp.app_secret' => '']);

    $settings = app(\App\Settings\WhatsAppSettings::class);
    $settings->app_secret = 'db-app-secret';
    $settings->save();

    $payload = json_encode(['object' => 'whatsapp_business_account', 'entry' => []]);
    $signature = 'sha256=' . hash_hmac('sha256', $payload, 'db-app-secret');

    $this->call('POST', '/api/v1/webhooks/whatsapp', [], [], [], [
        'HTTP_X_HUB_SIGNATURE_256' => $signature,
        'CONTENT_TYPE' => 'application/json',
    ], $payload)
        ->assertOk();
});

it('returns 403 when db app_secret is set but signature is wrong', function () {
    config(['services.whatsapp.app_secret' => '']);

    $settings = app(\App\Settings\WhatsAppSettings::class);
    $settings->app_secret = 'db-app-secret';
    $settings->save();

    $this->call('POST', '/api/v1/webhooks/whatsapp', [], [], [], [
        'HTTP_X_HUB_SIGNATURE_256' => 'sha256=wrong-signature',
        'CONTENT_TYPE' => 'application/json',
    ], json_encode(['object' => 'whatsapp_business_account']))
        ->assertForbidden();
});

/* Payload parsing */

it('returns 200 silently for non-whatsapp_business_account object', function () {
    config(['services.whatsapp.app_secret' => '']);

    $this->postJson('/api/v1/webhooks/whatsapp', ['object' => 'instagram'])
        ->assertOk();
});

it('processes incoming message events without error', function () {
    config(['services.whatsapp.app_secret' => '']);

    $payload = [
        'object' => 'whatsapp_business_account',
        'entry' => [[
            'id' => 'WABA_ID',
            'changes' => [[
                'field' => 'messages',
                'value' => [
                    'messaging_product' => 'whatsapp',
                    'metadata' => ['display_phone_number' => '233200000001', 'phone_number_id' => 'PHONE_ID'],
                    'messages' => [[
                        'from' => '233201234567',
                        'id' => 'wamid.test123',
                        'timestamp' => '1714000000',
                        'type' => 'text',
                        'text' => ['body' => 'Hello'],
                    ]],
                ],
            ]],
        ]],
    ];

    $this->postJson('/api/v1/webhooks/whatsapp', $payload)
        ->assertOk();
});

it('processes delivery status updates without error', function () {
    config(['services.whatsapp.app_secret' => '']);

    $payload = [
        'object' => 'whatsapp_business_account',
        'entry' => [[
            'id' => 'WABA_ID',
            'changes' => [[
                'field' => 'messages',
                'value' => [
                    'messaging_product' => 'whatsapp',
                    'metadata' => ['display_phone_number' => '233200000001', 'phone_number_id' => 'PHONE_ID'],
                    'statuses' => [[
                        'id' => 'wamid.test456',
                        'status' => 'delivered',
                        'timestamp' => '1714000100',
                        'recipient_id' => '233201234567',
                    ]],
                ],
            ]],
        ]],
    ];

    $this->postJson('/api/v1/webhooks/whatsapp', $payload)
        ->assertOk();
});
