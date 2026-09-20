<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PickupReminderMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pickup Reminder - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.pickup-reminder',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
