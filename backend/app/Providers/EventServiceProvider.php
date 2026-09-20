<?php

namespace App\Providers;

use App\Events\AirportBookingCancelled;
use App\Events\AirportBookingCreated;
use App\Events\AirportBookingStatusChanged;
use App\Events\BookingCreated;
use App\Events\ChauffeurBookingCancelled;
use App\Events\ChauffeurBookingCreated;
use App\Events\ChauffeurBookingStatusChanged;
use App\Events\PaymentStatusUpdated;
use App\Events\QuoteRequestSubmitted;
use App\Events\RentalCancelled;
use App\Events\RentalCompleted;
use App\Events\RentalCreated;
use App\Events\RentalOverdue;
use App\Events\RentalPickedUp;
use App\Events\RentalReturned;
use App\Events\RentalStatusChanged;
use App\Listeners\MarkTransactableAsPaid;
use App\Listeners\SendAirportBookingCancelledNotification;
use App\Listeners\SendAirportBookingCreatedNotification;
use App\Listeners\SendAirportBookingStatusChangedNotification;
use App\Listeners\SendChauffeurBookingCancelledNotification;
use App\Listeners\SendChauffeurBookingCreatedNotification;
use App\Listeners\SendChauffeurBookingStatusChangedNotification;
use App\Listeners\SendPaymentConfirmationNotification;
use App\Listeners\SendQuoteSubmittedNotification;
use App\Listeners\SendRentalCancelledNotification;
use App\Listeners\SendRentalCompletedNotification;
use App\Listeners\SendRentalCreatedNotification;
use App\Listeners\SendRentalOverdueNotification;
use App\Listeners\SendRentalPickedUpNotification;
use App\Listeners\SendRentalReturnedNotification;
use App\Listeners\SendRentalStatusChangedNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        RentalCreated::class => [
            SendRentalCreatedNotification::class,
        ],
        RentalPickedUp::class => [
            SendRentalPickedUpNotification::class,
        ],
        RentalReturned::class => [
            SendRentalReturnedNotification::class,
        ],
        RentalCompleted::class => [
            SendRentalCompletedNotification::class,
        ],
        RentalOverdue::class => [
            SendRentalOverdueNotification::class,
        ],
        RentalStatusChanged::class => [
            SendRentalStatusChangedNotification::class,
        ],
        RentalCancelled::class => [
            SendRentalCancelledNotification::class,
        ],
        QuoteRequestSubmitted::class => [
            SendQuoteSubmittedNotification::class,
        ],
        BookingCreated::class => [
            /* BookingCreated is used only for real-time dashboard WebSocket push
             * (useDashboardListener on the frontend). The full notification pipeline
             * (email, in-app, WhatsApp, SMS) is handled by RentalCreated above to
             * avoid sending duplicate notifications for the same rental creation. */
        ],
        PaymentStatusUpdated::class => [
            MarkTransactableAsPaid::class,
            SendPaymentConfirmationNotification::class,
        ],
        AirportBookingCreated::class => [
            SendAirportBookingCreatedNotification::class,
        ],
        AirportBookingCancelled::class => [
            SendAirportBookingCancelledNotification::class,
        ],
        AirportBookingStatusChanged::class => [
            SendAirportBookingStatusChangedNotification::class,
        ],
        ChauffeurBookingCreated::class => [
            SendChauffeurBookingCreatedNotification::class,
        ],
        ChauffeurBookingCancelled::class => [
            SendChauffeurBookingCancelledNotification::class,
        ],
        ChauffeurBookingStatusChanged::class => [
            SendChauffeurBookingStatusChangedNotification::class,
        ],
    ];
}
