<?php

use App\Mail\BookingConfirmationMail;
use App\Mail\NewQuoteRequestMail;
use App\Mail\OverdueAlertMail;
use App\Mail\PickupReminderMail;
use App\Mail\QuoteConfirmationMail;
use App\Mail\QuoteReadyMail;
use App\Mail\ReturnReminderMail;
use App\Mail\VehicleExpiryMail;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

/* POST /api/v1/notifications/test-email */
it('requires authentication to send test email', function () {
    $this->postJson('/api/v1/notifications/test-email', [
        'type' => 'booking_confirmation',
        'email' => 'test@example.com',
    ])->assertUnauthorized();
});

it('validates required fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type', 'email']);
});

it('rejects invalid notification type', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'invalid_type',
            'email' => 'test@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('rejects invalid email address', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'booking_confirmation',
            'email' => 'not-an-email',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('returns 422 when no rental data exists for rental-based types', function (string $type) {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => $type,
            'email' => 'test@example.com',
        ])
        ->assertStatus(422);
})->with(['booking_confirmation', 'overdue_alert', 'return_reminder', 'pickup_reminder', 'new_quote_request']);

it('sends booking confirmation test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'booking_confirmation',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(BookingConfirmationMail::class);
});

it('sends overdue alert test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'overdue_alert',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(OverdueAlertMail::class);
});

it('sends return reminder test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'return_reminder',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(ReturnReminderMail::class);
});

it('sends pickup reminder test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'pickup_reminder',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(PickupReminderMail::class);
});

it('sends vehicle expiry test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    Vehicle::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'vehicle_expiry',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(VehicleExpiryMail::class);
});

it('sends quote confirmation test email', function () {
    Mail::fake();

    $user = User::factory()->create();
    QuoteRequest::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'quote_confirmation',
            'email' => 'test@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(QuoteConfirmationMail::class);
});

it('sends new quote request test email to admin', function () {
    Mail::fake();

    $user = User::factory()->create();
    QuoteRequest::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'new_quote_request',
            'email' => 'admin@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(NewQuoteRequestMail::class);
});

it('sends quote ready test email to customer', function () {
    Mail::fake();

    $user = User::factory()->create();
    QuoteRequest::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'quote_ready',
            'email' => 'customer@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(QuoteReadyMail::class);
});

it('sends test email to specified recipient address', function () {
    Mail::fake();

    $user = User::factory()->create();
    Rental::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/notifications/test-email', [
            'type' => 'booking_confirmation',
            'email' => 'recipient@example.com',
        ])
        ->assertSuccessful();

    Mail::assertQueued(BookingConfirmationMail::class, function ($mail) {
        return $mail->hasTo('recipient@example.com');
    });
});
