<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ChauffeurBookingCancelledMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Chauffeur Booking Cancelled - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        $booking = $this->booking;

        return new Content(
            view: 'emails.chauffeur-booking-cancelled',
            with: [
                'customerName' => $booking->chauffeurCustomer?->full_name ?? '',
                'reference' => $booking->booking_reference,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
