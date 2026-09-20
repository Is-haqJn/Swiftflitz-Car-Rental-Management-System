<?php

use App\Events\QuoteRequestSubmitted;
use App\Jobs\SendTandCCopyJob;
use App\Mail\BookingConfirmationMail;
use App\Mail\TermsAndConditionsCopyMail;
use App\Models\Customer;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Settings\TermsSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('dispatches SendTandCCopyJob when QuoteRequestSubmitted fires', function () {
    Queue::fake();

    $quoteRequest = QuoteRequest::factory()->create();

    event(new QuoteRequestSubmitted($quoteRequest));

    Queue::assertPushed(SendTandCCopyJob::class, function (SendTandCCopyJob $job) use ($quoteRequest) {
        return $job->quoteRequest->is($quoteRequest);
    });
});

it('booking confirmation mail has terms and conditions pdf attachment when content is set', function () {
    $termsSettings = app(TermsSettings::class);
    $termsSettings->content = '<p>These are our terms and conditions.</p>';
    $termsSettings->save();

    $rental = Rental::factory()->create();
    $mailable = new BookingConfirmationMail($rental);

    $attachments = $mailable->attachments();

    $names = collect($attachments)->map(function (Attachment $a) {
        /* Retrieve the attachment name through the attachment DTO's as() accessor */
        return $a->as;
    });

    expect($names)->toContain('Terms-and-Conditions.pdf');
});

it('SendTandCCopyJob sends TermsAndConditionsCopyMail to customer', function () {
    Mail::fake();

    $customer = Customer::factory()->create(['email' => 'customer@example.com']);
    $quoteRequest = QuoteRequest::factory()->create(['customer_id' => $customer->id]);

    $termsSettings = app(TermsSettings::class);
    $termsSettings->content = '<p>These are our terms.</p>';
    $termsSettings->save();

    $job = new SendTandCCopyJob($quoteRequest);
    $job->handle();

    Mail::assertQueued(TermsAndConditionsCopyMail::class, function (TermsAndConditionsCopyMail $mail) use ($customer) {
        return $mail->customer->is($customer);
    });
});

it('BookingConfirmationMail skips PDF when TermsSettings content is empty', function () {
    $termsSettings = app(TermsSettings::class);
    $termsSettings->content = '';
    $termsSettings->save();

    $rental = Rental::factory()->create();
    $mailable = new BookingConfirmationMail($rental);

    expect($mailable->attachments())->toBeEmpty();
});
