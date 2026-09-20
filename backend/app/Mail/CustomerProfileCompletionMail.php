<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerProfileCompletionMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Customer $customer, public readonly string $rentalReference) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Complete your profile to finalise your Swiftflitz booking',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $completionUrl = "{$frontendUrl}/complete-profile/{$this->customer->reupload_token}";

        return new Content(
            view: 'emails.customer-profile-completion',
            with: [
                'customerName' => $this->customer->name,
                'rentalReference' => $this->rentalReference,
                'completionUrl' => $completionUrl,
                'expiresAt' => $this->customer->reupload_token_expires_at,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
