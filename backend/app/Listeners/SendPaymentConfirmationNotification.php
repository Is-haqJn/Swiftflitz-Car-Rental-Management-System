<?php

namespace App\Listeners;

use App\Events\PaymentStatusUpdated;
use App\Jobs\SendPaymentConfirmationJob;

class SendPaymentConfirmationNotification
{
    /**
     * Dispatch the payment confirmation job when a payment transaction is confirmed.
     */
    public function handle(PaymentStatusUpdated $event): void
    {
        SendPaymentConfirmationJob::dispatch($event->transaction);
    }
}
