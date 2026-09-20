<?php

namespace App\Jobs;

use App\Mail\TermsAndConditionsCopyMail;
use App\Models\QuoteRequest;
use App\Settings\GeneralSettings;
use App\Settings\TermsSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendTandCCopyJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly QuoteRequest $quoteRequest)
    {
        $this->onQueue('email');
    }

    public function handle(): void
    {
        $customer = $this->quoteRequest->customer;

        if (! $customer || ! $customer->email) {
            return;
        }

        $content = app(TermsSettings::class)->content ?? '';
        $appName = app(GeneralSettings::class)->site_name ?: config('app.name');

        $rentalId = $this->quoteRequest->converted_rental_id;

        Mail::to($customer->email)->queue(new TermsAndConditionsCopyMail($customer, $content, $appName, $rentalId));
    }
}
