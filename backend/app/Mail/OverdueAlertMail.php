<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OverdueAlertMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Overdue Rental Alert - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.overdue-alert',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
