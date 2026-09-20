<?php

namespace App\Listeners;

use App\Events\AirportBookingStatusChanged;
use App\Jobs\SendAirportBookingStatusChangedJob;

class SendAirportBookingStatusChangedNotification
{
    public function handle(AirportBookingStatusChanged $event): void
    {
        SendAirportBookingStatusChangedJob::dispatch($event->booking, $event->oldStatus);
    }
}
