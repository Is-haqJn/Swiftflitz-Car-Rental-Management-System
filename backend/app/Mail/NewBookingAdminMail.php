<?php

namespace App\Mail;

use App\Models\Rental;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewBookingAdminMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental, public readonly User $admin) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Booking - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-booking-admin',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
