<?php

namespace App\Listeners;

use App\Events\RentalStatusChanged;
use App\Jobs\SendRentalStatusChangedJob;

class SendRentalStatusChangedNotification
{
    /**
     * Dispatch the job that handles all notification channels (in-app, email, WhatsApp, SMS).
     */
    public function handle(RentalStatusChanged $event): void
    {
        SendRentalStatusChangedJob::dispatch($event->rental, $event->oldStatus);
    }
}
