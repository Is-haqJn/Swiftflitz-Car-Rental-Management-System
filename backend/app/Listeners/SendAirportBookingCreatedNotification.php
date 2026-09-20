<?php

namespace App\Listeners;

use App\Events\AirportBookingCreated;
use App\Jobs\SendAirportBookingConfirmationJob;

class SendAirportBookingCreatedNotification
{
    public function handle(AirportBookingCreated $event): void
    {
        SendAirportBookingConfirmationJob::dispatch($event->booking);
    }
}
