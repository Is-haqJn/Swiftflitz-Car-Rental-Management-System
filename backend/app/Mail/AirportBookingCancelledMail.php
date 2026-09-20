<?php

namespace App\Mail;

use App\Models\AirportBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AirportBookingCancelledMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly AirportBooking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Airport Transfer Cancelled - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        $booking = $this->booking;

        return new Content(
            view: 'emails.airport-booking-cancelled',
            with: [
                'customerName' => $booking->airportCustomer?->full_name ?? $booking->passenger_name ?? '',
                'reference' => $booking->booking_reference,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
