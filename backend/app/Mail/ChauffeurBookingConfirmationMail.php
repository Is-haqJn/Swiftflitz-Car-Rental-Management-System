<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ChauffeurBookingConfirmationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Chauffeur Booking - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        $booking = $this->booking->loadMissing(['chauffeurCustomer', 'vehicle']);

        return new Content(
            view: 'emails.chauffeur-booking-confirmation',
            with: [
                'customerName' => $booking->chauffeurCustomer?->full_name ?? '',
                'reference' => $booking->booking_reference,
                'pickupTime' => $booking->pickup_time?->format('D, d M Y H:i') ?? '',
                'pickupLocation' => $booking->pickup_location ?? null,
                'vehicleName' => $booking->vehicle?->name ?? null,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
