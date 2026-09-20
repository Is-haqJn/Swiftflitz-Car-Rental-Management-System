<?php

namespace App\Mail;

use App\Models\AirportBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AirportBookingConfirmationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly AirportBooking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Airport Transfer Booking - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        $booking = $this->booking;

        return new Content(
            view: 'emails.airport-booking-confirmation',
            with: [
                'customerName' => $booking->airportCustomer?->full_name ?? $booking->passenger_name ?? '',
                'reference' => $booking->booking_reference,
                'scheduledAt' => $booking->scheduled_at?->format('D, d M Y H:i') ?? '',
                'direction' => $booking->direction ? ucfirst(is_string($booking->direction) ? $booking->direction : $booking->direction->value) : null,
                'vehicleName' => $booking->vehicle?->name,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
