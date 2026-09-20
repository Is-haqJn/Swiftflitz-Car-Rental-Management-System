<?php

use App\Models\User;
use App\Models\WhatsAppTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function userWithWhatsAppTemplatesPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_whatsapp_templates', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_whatsapp_templates');

    return $user;
}

function createWhatsAppTemplate(array $overrides = []): WhatsAppTemplate
{
    return WhatsAppTemplate::create(array_merge([
        'key' => 'new_booking',
        'name' => 'New Booking Confirmation',
        'description' => 'Sent to customers when a booking is confirmed.',
        'template_name' => 'booking_confirmation',
        'default_template_name' => 'booking_confirmation',
        'header' => null,
        'default_header' => null,
        'body' => 'Hi {{1}}, your booking {{2}} has been confirmed. Vehicle: {{3}}.',
        'default_body' => 'Hi {{1}}, your booking {{2}} has been confirmed. Vehicle: {{3}}.',
        'footer' => null,
        'default_footer' => null,
        'variables' => ['customer_name', 'booking_reference', 'vehicle_name'],
        'default_variables' => ['customer_name', 'booking_reference', 'vehicle_name'],
        'language_code' => 'en_US',
    ], $overrides));
}

/* GET /api/v1/whatsapp-templates */

it('requires authentication to list whatsapp templates', function () {
    $this->getJson('/api/v1/whatsapp-templates')
        ->assertStatus(401);
});

it('can list whatsapp templates when authenticated', function () {
    createWhatsAppTemplate();

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/whatsapp-templates')
        ->assertStatus(200)
        ->assertJsonPath('data.0.key', 'new_booking');
});

it('can list whatsapp templates as super_admin', function () {
    createWhatsAppTemplate();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/whatsapp-templates')
        ->assertStatus(200);
});

/* GET /api/v1/whatsapp-templates/{key} */

it('requires authentication to show a whatsapp template', function () {
    createWhatsAppTemplate();

    $this->getJson('/api/v1/whatsapp-templates/new_booking')
        ->assertStatus(401);
});

it('can show a single whatsapp template', function () {
    createWhatsAppTemplate();

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/whatsapp-templates/new_booking')
        ->assertStatus(200)
        ->assertJsonPath('data.key', 'new_booking')
        ->assertJsonPath('data.template_name', 'booking_confirmation')
        ->assertJsonPath('data.language_code', 'en_US');
});

it('returns 404 for unknown whatsapp template key', function () {
    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/whatsapp-templates/does_not_exist')
        ->assertStatus(404);
});

/* PUT /api/v1/whatsapp-templates/{key} */

it('requires authentication to update a whatsapp template', function () {
    createWhatsAppTemplate();

    $this->putJson('/api/v1/whatsapp-templates/new_booking', ['body' => 'New body', 'template_name' => 'test', 'language_code' => 'en_US', 'variables' => []])
        ->assertStatus(401);
});

it('cannot update a whatsapp template without edit_whatsapp_templates permission', function () {
    $user = User::factory()->create();
    createWhatsAppTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/whatsapp-templates/new_booking', [
            'template_name' => 'booking_confirmation',
            'language_code' => 'en_US',
            'body' => 'Updated body {{1}}.',
            'variables' => ['customer_name'],
        ])
        ->assertStatus(403);
});

it('can update a whatsapp template with edit_whatsapp_templates permission', function () {
    $user = userWithWhatsAppTemplatesPermission();
    createWhatsAppTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/whatsapp-templates/new_booking', [
            'template_name' => 'booking_confirmation_v2',
            'language_code' => 'en_US',
            'body' => 'Hi {{1}}, booking {{2}} confirmed!',
            'variables' => ['customer_name', 'booking_reference'],
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.template_name', 'booking_confirmation_v2');

    expect(WhatsAppTemplate::query()->where('key', 'new_booking')->first()->template_name)->toBe('booking_confirmation_v2');
});

it('can update a whatsapp template as super_admin', function () {
    createWhatsAppTemplate();

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/whatsapp-templates/new_booking', [
            'template_name' => 'booking_confirmation',
            'language_code' => 'fr',
            'body' => 'Bonjour {{1}}, reservation {{2}} confirmee.',
            'variables' => ['customer_name', 'booking_reference'],
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.language_code', 'fr');
});

it('validates required fields when updating a whatsapp template', function () {
    $user = userWithWhatsAppTemplatesPermission();
    createWhatsAppTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/whatsapp-templates/new_booking', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['template_name', 'body', 'variables', 'language_code']);
});

it('clears cache when whatsapp template is updated', function () {
    $user = userWithWhatsAppTemplatesPermission();
    $template = createWhatsAppTemplate();
    Cache::put('whatsapp_template:new_booking', $template, 300);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/whatsapp-templates/new_booking', [
            'template_name' => 'booking_confirmation',
            'language_code' => 'en_US',
            'body' => 'Updated body {{1}}.',
            'variables' => ['customer_name'],
        ])
        ->assertStatus(200);

    expect(Cache::has('whatsapp_template:new_booking'))->toBeFalse();
});

/* POST /api/v1/whatsapp-templates/{key}/reset */

it('requires authentication to reset a whatsapp template', function () {
    createWhatsAppTemplate();

    $this->postJson('/api/v1/whatsapp-templates/new_booking/reset')
        ->assertStatus(401);
});

it('cannot reset a whatsapp template without edit_whatsapp_templates permission', function () {
    $user = User::factory()->create();
    createWhatsAppTemplate(['body' => 'Custom body {{1}}.']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/whatsapp-templates/new_booking/reset')
        ->assertStatus(403);
});

it('can reset a whatsapp template to defaults with edit_whatsapp_templates permission', function () {
    $user = userWithWhatsAppTemplatesPermission();
    createWhatsAppTemplate([
        'template_name' => 'custom_name',
        'body' => 'Custom body {{1}}.',
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/whatsapp-templates/new_booking/reset')
        ->assertStatus(200)
        ->assertJsonPath('data.template_name', 'booking_confirmation')
        ->assertJsonPath('data.is_customised', false);
});

it('clears cache when whatsapp template is reset', function () {
    $user = userWithWhatsAppTemplatesPermission();
    $template = createWhatsAppTemplate(['body' => 'Custom body.']);
    Cache::put('whatsapp_template:new_booking', $template, 300);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/whatsapp-templates/new_booking/reset')
        ->assertStatus(200);

    expect(Cache::has('whatsapp_template:new_booking'))->toBeFalse();
});

it('whatsapp template resource includes is_customised flag', function () {
    createWhatsAppTemplate([
        'body' => 'Changed body {{1}}.',
    ]);

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/whatsapp-templates/new_booking')
        ->assertStatus(200)
        ->assertJsonPath('data.is_customised', true);
});
