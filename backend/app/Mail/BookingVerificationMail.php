<?php

namespace App\Mail;

use App\Models\BookingVerificationToken;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingVerificationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly BookingVerificationToken $verificationToken) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirm your rental booking',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $verifyUrl = "{$frontendUrl}/verify-booking/{$this->verificationToken->token}";

        return new Content(
            view: 'emails.booking-verification',
            with: [
                'customerName' => $this->verificationToken->customer->name ?? 'there',
                'verifyUrl' => $verifyUrl,
                'expiresAt' => $this->verificationToken->expires_at,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
