<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerProfileSubmittedMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Customer $customer, public readonly string $rentalReference) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your profile details have been received - {$this->rentalReference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.customer-profile-submitted',
            with: [
                'customerName' => $this->customer->name,
                'rentalReference' => $this->rentalReference,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
