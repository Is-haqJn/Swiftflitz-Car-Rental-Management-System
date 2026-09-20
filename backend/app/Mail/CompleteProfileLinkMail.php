<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CompleteProfileLinkMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Customer $customer, public readonly string $token) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Complete Your Profile to Confirm Your Booking',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $profileUrl = "{$frontendUrl}/complete-profile/{$this->token}";

        return new Content(
            view: 'emails.complete-profile-link',
            with: [
                'customer' => $this->customer,
                'profileUrl' => $profileUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
