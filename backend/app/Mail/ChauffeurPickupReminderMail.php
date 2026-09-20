<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ChauffeurPickupReminderMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking, public readonly User $recipient) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pickup Reminder - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.chauffeur-pickup-reminder',
            with: [
                'booking' => $this->booking,
                'recipientName' => $this->recipient->name,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
