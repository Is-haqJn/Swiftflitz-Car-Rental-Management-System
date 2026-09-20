<?php

namespace App\Listeners;

use App\Events\RentalOverdue;
use App\Jobs\SendOverdueAlertJob;

class SendRentalOverdueNotification
{
    /**
     * Dispatch the overdue alert job when a rental becomes overdue.
     */
    public function handle(RentalOverdue $event): void
    {
        SendOverdueAlertJob::dispatch($event->rental);
    }
}
