<?php

namespace App\Listeners;

use App\Events\RentalCancelled;
use App\Jobs\SendRentalCancelledJob;

class SendRentalCancelledNotification
{
    public function handle(RentalCancelled $event): void
    {
        SendRentalCancelledJob::dispatch($event->rental);
    }
}
