<?php

namespace App\Listeners;

use App\Events\AirportBookingCancelled;
use App\Jobs\SendAirportBookingCancelledJob;

class SendAirportBookingCancelledNotification
{
    public function handle(AirportBookingCancelled $event): void
    {
        SendAirportBookingCancelledJob::dispatch($event->booking);
    }
}
