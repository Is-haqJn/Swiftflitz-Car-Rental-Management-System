<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminProfileSubmittedMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Customer $customer, public readonly string $rentalReference) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New customer profile submitted for review - {$this->customer->name}",
        );
    }

    public function content(): Content
    {
        $adminUrl = config('app.admin_url', config('app.frontend_url', config('app.url'))) . '/management/customers/' . $this->customer->id;

        return new Content(
            view: 'emails.admin-profile-submitted',
            with: [
                'customerName' => $this->customer->name,
                'customerEmail' => $this->customer->email,
                'customerPhone' => $this->customer->phone,
                'rentalReference' => $this->rentalReference,
                'adminUrl' => $adminUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
