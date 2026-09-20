<?php

namespace App\Mail;

use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewQuoteRequestMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly QuoteRequest $quoteRequest, public readonly User $admin) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Quote Request - {$this->quoteRequest->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-quote-request',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
