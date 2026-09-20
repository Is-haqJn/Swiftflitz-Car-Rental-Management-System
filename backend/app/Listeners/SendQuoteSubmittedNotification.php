<?php

namespace App\Listeners;

use App\Events\QuoteRequestSubmitted;
use App\Jobs\SendQuoteConfirmationJob;
use App\Jobs\SendTandCCopyJob;

class SendQuoteSubmittedNotification
{
    /**
     * Dispatch the quote confirmation job when a quote request is submitted.
     */
    public function handle(QuoteRequestSubmitted $event): void
    {
        SendQuoteConfirmationJob::dispatch($event->quoteRequest);
        SendTandCCopyJob::dispatch($event->quoteRequest);
    }
}
