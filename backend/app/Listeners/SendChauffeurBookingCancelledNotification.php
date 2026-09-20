<?php

namespace App\Listeners;

use App\Events\ChauffeurBookingCancelled;
use App\Jobs\SendChauffeurBookingCancelledJob;

class SendChauffeurBookingCancelledNotification
{
    public function handle(ChauffeurBookingCancelled $event): void
    {
        SendChauffeurBookingCancelledJob::dispatch($event->booking);
    }
}
