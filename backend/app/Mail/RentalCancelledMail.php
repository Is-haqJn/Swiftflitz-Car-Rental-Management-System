<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentalCancelledMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Rental Cancelled - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        $rental = $this->rental;

        return new Content(
            view: 'emails.rental-cancelled',
            with: [
                'customerName' => $rental->customer?->name ?? '',
                'reference' => $rental->reference,
                'vehicleName' => $rental->vehicle?->name ?? null,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
