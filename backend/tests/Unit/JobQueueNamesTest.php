<?php

use App\Jobs\CheckVehicleExpiryJob;
use App\Jobs\FlagOverdueRentals;
use App\Jobs\SendBookingConfirmationJob;
use App\Jobs\SendDueReturnReminders;
use App\Jobs\SendOverdueAlertJob;
use App\Jobs\SendPickupReminderJob;
use App\Jobs\SendQuoteConfirmationJob;
use App\Jobs\SendReturnReminderJob;
use App\Jobs\SendVehicleExpiryNotificationJob;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

/* Email jobs use 'email' queue */
it('SendBookingConfirmationJob dispatches on the email queue', function () {
    Queue::fake();

    $rental = Rental::factory()->create();
    SendBookingConfirmationJob::dispatch($rental);

    Queue::assertPushedOn('email', SendBookingConfirmationJob::class);
});

it('SendOverdueAlertJob dispatches on the email queue', function () {
    Queue::fake();

    $rental = Rental::factory()->create();
    SendOverdueAlertJob::dispatch($rental);

    Queue::assertPushedOn('email', SendOverdueAlertJob::class);
});

it('SendReturnReminderJob dispatches on the email queue', function () {
    Queue::fake();

    $rental = Rental::factory()->create();
    SendReturnReminderJob::dispatch($rental);

    Queue::assertPushedOn('email', SendReturnReminderJob::class);
});

it('SendQuoteConfirmationJob dispatches on the email queue', function () {
    Queue::fake();

    $quoteRequest = QuoteRequest::factory()->create();
    SendQuoteConfirmationJob::dispatch($quoteRequest);

    Queue::assertPushedOn('email', SendQuoteConfirmationJob::class);
});

it('SendVehicleExpiryNotificationJob dispatches on the email queue', function () {
    Queue::fake();

    $vehicle = Vehicle::factory()->create();
    SendVehicleExpiryNotificationJob::dispatch($vehicle);

    Queue::assertPushedOn('email', SendVehicleExpiryNotificationJob::class);
});

it('SendPickupReminderJob dispatches on the email queue', function () {
    Queue::fake();

    SendPickupReminderJob::dispatch();

    Queue::assertPushedOn('email', SendPickupReminderJob::class);
});

/* High-priority jobs use 'high' queue */
it('FlagOverdueRentals dispatches on the high queue', function () {
    Queue::fake();

    FlagOverdueRentals::dispatch();

    Queue::assertPushedOn('high', FlagOverdueRentals::class);
});

it('CheckVehicleExpiryJob dispatches on the high queue', function () {
    Queue::fake();

    CheckVehicleExpiryJob::dispatch();

    Queue::assertPushedOn('high', CheckVehicleExpiryJob::class);
});

it('SendDueReturnReminders dispatches on the high queue', function () {
    Queue::fake();

    SendDueReturnReminders::dispatch();

    Queue::assertPushedOn('high', SendDueReturnReminders::class);
});
