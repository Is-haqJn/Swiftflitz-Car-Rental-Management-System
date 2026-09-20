<?php

use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * Create an email template for testing.
 */
function makeEmailTemplate(array $overrides = []): EmailTemplate
{
    return EmailTemplate::factory()->create(array_merge([
        'key' => 'booking-confirmation',
        'name' => 'Booking Confirmation',
        'description' => 'Sent when a booking is confirmed.',
        'subject' => 'Your booking is confirmed',
        'default_subject' => 'Your booking is confirmed',
        'html_content' => '<p>Hello {{name}}, your booking is confirmed.</p>',
        'default_html' => '<p>Hello {{name}}, your booking is confirmed.</p>',
    ], $overrides));
}

/* GET /api/v1/email-templates */
it('requires authentication to list email templates', function () {
    $this->getJson('/api/v1/email-templates')
        ->assertUnauthorized();
});

it('can list all email templates', function () {
    $user = User::factory()->create();
    makeEmailTemplate();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/email-templates')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray()
        ->and(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

/* GET /api/v1/email-templates/{key} */
it('requires authentication to view a specific email template', function () {
    $this->getJson('/api/v1/email-templates/booking-confirmation')
        ->assertUnauthorized();
});

it('can view a specific email template by key', function () {
    $user = User::factory()->create();
    makeEmailTemplate(['key' => 'booking-confirmation']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/email-templates/booking-confirmation')
        ->assertSuccessful();

    expect($response->json('data.key'))->toBe('booking-confirmation')
        ->and($response->json('data.subject'))->toBe('Your booking is confirmed');
});

it('returns 404 for a non-existent email template key', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/email-templates/non-existent-key')
        ->assertNotFound();
});

/* PUT /api/v1/email-templates/{key} */
it('requires authentication to update an email template', function () {
    $this->putJson('/api/v1/email-templates/booking-confirmation', [])
        ->assertUnauthorized();
});

it('can update the subject of an email template', function () {
    $user = User::factory()->create();
    makeEmailTemplate(['key' => 'welcome-email']);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/email-templates/welcome-email', [
            'subject' => 'Welcome to Swiftflitz!',
            'html_content' => '<p>Welcome aboard.</p>',
        ])
        ->assertSuccessful();

    expect($response->json('data.subject'))->toBe('Welcome to Swiftflitz!');
});

it('can update the html content of an email template', function () {
    $user = User::factory()->create();
    makeEmailTemplate(['key' => 'return-reminder']);

    $response = $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/email-templates/return-reminder', [
            'subject' => 'Return reminder',
            'html_content' => '<p>Please return your vehicle.</p>',
        ])
        ->assertSuccessful();

    expect($response->json('data.html_content'))->toBe('<p>Please return your vehicle.</p>');
});

it('returns 404 when updating a non-existent email template', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/email-templates/does-not-exist', [
            'subject' => 'Test',
            'html_content' => '<p>Test</p>',
        ])
        ->assertNotFound();
});

/* POST /api/v1/email-templates/{key}/reset */
it('requires authentication to reset an email template', function () {
    $this->postJson('/api/v1/email-templates/booking-confirmation/reset')
        ->assertUnauthorized();
});

it('can reset an email template to its default', function () {
    $user = User::factory()->create();

    makeEmailTemplate([
        'key' => 'overdue-alert',
        'subject' => 'Custom Subject',
        'html_content' => '<p>Custom content.</p>',
        'default_subject' => 'Vehicle Overdue Alert',
        'default_html' => '<p>Your vehicle is overdue.</p>',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/email-templates/overdue-alert/reset')
        ->assertSuccessful();

    expect($response->json('data.subject'))->toBe('Vehicle Overdue Alert')
        ->and($response->json('data.html_content'))->toBe('<p>Your vehicle is overdue.</p>');
});

it('returns 404 when resetting a non-existent email template', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/email-templates/invalid-key/reset')
        ->assertNotFound();
});
