<?php

namespace App\Listeners;

use App\Events\ChauffeurBookingCreated;
use App\Jobs\SendChauffeurBookingConfirmationJob;

class SendChauffeurBookingCreatedNotification
{
    public function handle(ChauffeurBookingCreated $event): void
    {
        SendChauffeurBookingConfirmationJob::dispatch($event->booking);
    }
}
