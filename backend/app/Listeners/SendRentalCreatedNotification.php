<?php

namespace App\Listeners;

use App\Events\RentalCreated;
use App\Jobs\SendBookingConfirmationJob;

class SendRentalCreatedNotification
{
    /**
     * Dispatch the booking confirmation job when a rental is created.
     */
    public function handle(RentalCreated $event): void
    {
        SendBookingConfirmationJob::dispatch($event->rental);
    }
}
