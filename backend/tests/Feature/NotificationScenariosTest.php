<?php

use App\Events\QuoteRequestSubmitted;
use App\Jobs\SendBookingConfirmationJob;
use App\Jobs\SendQuoteConfirmationJob;
use App\Mail\BookingConfirmationMail;
use App\Mail\NewBookingAdminMail;
use App\Mail\NewQuoteRequestMail;
use App\Mail\QuoteConfirmationMail;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\Vehicle;
use App\Services\PublicBookingService;
use App\Settings\NotificationSystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* PublicBookingService - event dispatch */
it('PublicBookingService dispatches QuoteRequestSubmitted event on creation', function () {
    Event::fake([QuoteRequestSubmitted::class]);

    $vehicle = Vehicle::factory()->create();

    app(PublicBookingService::class)->createBooking([
        'vehicle_id' => $vehicle->id,
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '0241234567',
        'rental_days' => 3,
    ]);

    Event::assertDispatched(QuoteRequestSubmitted::class);
});

/* SendQuoteConfirmationJob - customer email */
it('SendQuoteConfirmationJob sends confirmation email to the customer', function () {
    Mail::fake();

    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    Mail::assertQueued(QuoteConfirmationMail::class, fn ($mail) => $mail->hasTo('customer@example.com'));
});

/* SendQuoteConfirmationJob - admin in-app notification */
it('SendQuoteConfirmationJob sends in-app notification to admins when admins exist', function () {
    Mail::fake();

    $admin = adminUser();
    Permission::findOrCreate('rentals.view_quotes');
    Permission::findOrCreate('rentals.view_all');
    $admin->givePermissionTo('rentals.view_all');

    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    $this->assertDatabaseHas('app_notifications', [
        'user_id' => $admin->id,
        'type' => 'new_quote_request',
    ]);
});

/* SendQuoteConfirmationJob - admin email */
it('SendQuoteConfirmationJob sends email to admins with quote_request email enabled', function () {
    Mail::fake();

    // ? The migration default for email_quote_request is false - seed it to true for this test
    $settings = app(NotificationSystemSettings::class);
    $settings->email_quote_request = true;
    $settings->save();

    $admin = adminUser();
    Permission::findOrCreate('rentals.view_quotes');
    Permission::findOrCreate('rentals.view_all');
    $admin->givePermissionTo('rentals.view_all');

    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    Mail::assertQueued(NewQuoteRequestMail::class, fn ($mail) => $mail->hasTo($admin->email));
});

it('SendQuoteConfirmationJob does not send admin email when no admins exist', function () {
    Mail::fake();

    // No admin users created - no NewQuoteRequestMail should be sent
    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    Mail::assertQueued(QuoteConfirmationMail::class);
    Mail::assertNotQueued(NewQuoteRequestMail::class);
});

it('SendQuoteConfirmationJob skips customer email when email_quote_confirmation is disabled', function () {
    Mail::fake();

    $settings = app(NotificationSystemSettings::class);
    $settings->email_quote_confirmation = false;
    $settings->save();

    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    Mail::assertNotQueued(QuoteConfirmationMail::class);
});

it('SendQuoteConfirmationJob sends customer email when email_quote_confirmation is enabled', function () {
    Mail::fake();

    $settings = app(NotificationSystemSettings::class);
    $settings->email_quote_confirmation = true;
    $settings->save();

    $quoteRequest = QuoteRequest::factory()->create(['email' => 'customer@example.com']);

    SendQuoteConfirmationJob::dispatchSync($quoteRequest);

    Mail::assertQueued(QuoteConfirmationMail::class, fn ($mail) => $mail->hasTo('customer@example.com'));
});

/* SendBookingConfirmationJob - customer email */
it('SendBookingConfirmationJob sends confirmation email to the customer', function () {
    Mail::fake();

    $rental = Rental::factory()->create();
    $rental->load(['customer']);

    SendBookingConfirmationJob::dispatchSync($rental);

    Mail::assertQueued(BookingConfirmationMail::class, fn ($mail) => $mail->hasTo($rental->customer->email));
});

/* SendBookingConfirmationJob - admin in-app notification */
it('SendBookingConfirmationJob sends in-app notification to admins', function () {
    Mail::fake();

    $admin = adminUser();
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.view_all');

    $rental = Rental::factory()->create();

    SendBookingConfirmationJob::dispatchSync($rental);

    $this->assertDatabaseHas('app_notifications', [
        'user_id' => $admin->id,
        'type' => 'booking_created',
    ]);
});

/* SendBookingConfirmationJob - admin email */
it('SendBookingConfirmationJob sends new booking email to admins', function () {
    Mail::fake();

    $admin = adminUser();
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $admin->givePermissionTo('rentals.view_all');

    $rental = Rental::factory()->create();

    SendBookingConfirmationJob::dispatchSync($rental);

    Mail::assertQueued(NewBookingAdminMail::class, fn ($mail) => $mail->hasTo($admin->email));
});

/* allSessions endpoint returns proper paginated format */
it('allSessions endpoint returns data as flat array not paginator object', function () {
    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/admin/sessions');

    $response->assertOk();
    expect($response->json('data'))->toBeArray();
    // data must be a sequential array (not an object with nested 'data' key)
    expect(array_is_list($response->json('data')))->toBeTrue();
});
