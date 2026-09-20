<?php

namespace App\Listeners;

use App\Events\ChauffeurBookingStatusChanged;
use App\Jobs\SendChauffeurBookingStatusChangedJob;

class SendChauffeurBookingStatusChangedNotification
{
    public function handle(ChauffeurBookingStatusChanged $event): void
    {
        SendChauffeurBookingStatusChangedJob::dispatch($event->booking, $event->oldStatus);
    }
}
