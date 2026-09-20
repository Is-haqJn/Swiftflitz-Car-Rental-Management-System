<?php

namespace App\Mail;

use App\Models\QuoteRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteConfirmationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly QuoteRequest $quoteRequest) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Quote Request Received - {$this->quoteRequest->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
