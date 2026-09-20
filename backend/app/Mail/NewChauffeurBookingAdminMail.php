<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewChauffeurBookingAdminMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking, public readonly User $recipient) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Chauffeur Booking - {$this->booking->booking_reference}",
        );
    }

    public function content(): Content
    {
        $booking = $this->booking->loadMissing(['chauffeurCustomer', 'vehicle', 'branch']);

        return new Content(
            view: 'emails.new-chauffeur-booking-admin',
            with: [
                'booking' => $booking,
                'recipient' => $this->recipient,
                'currency_symbol' => $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
