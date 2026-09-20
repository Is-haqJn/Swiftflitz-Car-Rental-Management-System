<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentalStatusChangedMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental, public readonly string $oldStatus, public readonly string $newStatus) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Booking Update - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        $rental = $this->rental;

        return new Content(
            view: 'emails.rental-status-changed',
            with: [
                'customerName' => $rental->customer?->name ?? '',
                'reference' => $rental->reference,
                'vehicleName' => $rental->vehicle?->name ?? null,
                'oldStatus' => ucfirst(str_replace('_', ' ', $this->oldStatus)),
                'newStatus' => ucfirst(str_replace('_', ' ', $this->newStatus)),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
