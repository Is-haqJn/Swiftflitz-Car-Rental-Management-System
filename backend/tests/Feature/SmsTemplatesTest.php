<?php

use App\Models\SmsTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function userWithSmsTemplatesPermission(): User
{
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'settings.edit_sms_templates', 'guard_name' => 'web']);
    $user->givePermissionTo('settings.edit_sms_templates');

    return $user;
}

function createSmsTemplate(array $overrides = []): SmsTemplate
{
    return SmsTemplate::create(array_merge([
        'key' => 'new_booking',
        'name' => 'New Booking Confirmation',
        'description' => 'Sent to customers when a booking is confirmed.',
        'body' => 'Hi {{customer_name}}, your booking {{booking_reference}} has been confirmed. Vehicle: {{vehicle_name}}. Thank you!',
        'default_body' => 'Hi {{customer_name}}, your booking {{booking_reference}} has been confirmed. Vehicle: {{vehicle_name}}. Thank you!',
    ], $overrides));
}

/* GET /api/v1/sms-templates */

it('requires authentication to list sms templates', function () {
    $this->getJson('/api/v1/sms-templates')
        ->assertStatus(401);
});

it('can list sms templates when authenticated', function () {
    createSmsTemplate();

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/sms-templates')
        ->assertStatus(200)
        ->assertJsonPath('data.0.key', 'new_booking');
});

it('can list sms templates as super_admin', function () {
    createSmsTemplate();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/sms-templates')
        ->assertStatus(200);
});

/* GET /api/v1/sms-templates/{key} */

it('requires authentication to show an sms template', function () {
    createSmsTemplate();

    $this->getJson('/api/v1/sms-templates/new_booking')
        ->assertStatus(401);
});

it('can show a single sms template', function () {
    createSmsTemplate();

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/sms-templates/new_booking')
        ->assertStatus(200)
        ->assertJsonPath('data.key', 'new_booking');
});

it('returns 404 for unknown sms template key', function () {
    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/sms-templates/does_not_exist')
        ->assertStatus(404);
});

/* PUT /api/v1/sms-templates/{key} */

it('requires authentication to update an sms template', function () {
    createSmsTemplate();

    $this->putJson('/api/v1/sms-templates/new_booking', ['body' => 'New body'])
        ->assertStatus(401);
});

it('cannot update an sms template without edit_sms permission', function () {
    $user = User::factory()->create();
    createSmsTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/sms-templates/new_booking', ['body' => 'Updated body.'])
        ->assertStatus(403);
});

it('can update an sms template with edit_sms permission', function () {
    $user = userWithSmsTemplatesPermission();
    createSmsTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/sms-templates/new_booking', ['body' => 'Hi {{customer_name}}, booking {{booking_reference}} done!'])
        ->assertStatus(200)
        ->assertJsonPath('data.body', 'Hi {{customer_name}}, booking {{booking_reference}} done!');

    expect(SmsTemplate::query()->where('key', 'new_booking')->first()->body)
        ->toBe('Hi {{customer_name}}, booking {{booking_reference}} done!');
});

it('can update an sms template as super_admin', function () {
    createSmsTemplate();

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/sms-templates/new_booking', ['body' => 'Super admin updated body.'])
        ->assertStatus(200)
        ->assertJsonPath('data.body', 'Super admin updated body.');
});

it('validates body is required when updating an sms template', function () {
    $user = userWithSmsTemplatesPermission();
    createSmsTemplate();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/sms-templates/new_booking', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['body']);
});

it('clears cache when sms template is updated', function () {
    $user = userWithSmsTemplatesPermission();
    $template = createSmsTemplate();
    Cache::put('sms_template:new_booking', $template, 300);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/sms-templates/new_booking', ['body' => 'Updated body.'])
        ->assertStatus(200);

    expect(Cache::has('sms_template:new_booking'))->toBeFalse();
});

/* POST /api/v1/sms-templates/{key}/reset */

it('requires authentication to reset an sms template', function () {
    createSmsTemplate();

    $this->postJson('/api/v1/sms-templates/new_booking/reset')
        ->assertStatus(401);
});

it('cannot reset an sms template without edit_sms permission', function () {
    $user = User::factory()->create();
    createSmsTemplate(['body' => 'Custom body.']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/sms-templates/new_booking/reset')
        ->assertStatus(403);
});

it('can reset an sms template to default body', function () {
    $user = userWithSmsTemplatesPermission();
    createSmsTemplate(['body' => 'Custom body that is not the default.']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/sms-templates/new_booking/reset')
        ->assertStatus(200)
        ->assertJsonPath('data.is_customised', false);
});

it('clears cache when sms template is reset', function () {
    $user = userWithSmsTemplatesPermission();
    $template = createSmsTemplate(['body' => 'Custom body.']);
    Cache::put('sms_template:new_booking', $template, 300);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/sms-templates/new_booking/reset')
        ->assertStatus(200);

    expect(Cache::has('sms_template:new_booking'))->toBeFalse();
});

it('sms template resource includes is_customised flag', function () {
    createSmsTemplate(['body' => 'Changed body.']);

    $this->actingAs(User::factory()->create(), 'sanctum')
        ->getJson('/api/v1/sms-templates/new_booking')
        ->assertStatus(200)
        ->assertJsonPath('data.is_customised', true);
});
