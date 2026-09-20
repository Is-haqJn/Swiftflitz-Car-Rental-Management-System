<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentLinkMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental, public readonly string $paymentUrl, public readonly float $amountDue) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Complete Your Payment - {$this->rental->reference}",
        );
    }

    public function content(): Content
    {
        $rental = $this->rental->loadMissing(['customer']);

        return new Content(
            view: 'emails.payment-link',
            with: [
                'customerName' => $rental->customer?->name ?? 'Customer',
                'reference' => $rental->reference,
                'amountDue' => $this->amountDue,
                'paymentUrl' => $this->paymentUrl,
                'currency_symbol' => $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
