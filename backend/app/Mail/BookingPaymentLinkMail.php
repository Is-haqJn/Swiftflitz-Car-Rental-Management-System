<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingPaymentLinkMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly string $customerName, public readonly string $reference, public readonly float $amountDue, public readonly string $paymentUrl, public readonly string $bookingType = 'Booking', public readonly string $currencySymbol = '₵') {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Complete Your Payment - {$this->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-link',
            with: [
                'customerName' => $this->customerName,
                'reference' => $this->reference,
                'amountDue' => $this->amountDue,
                'paymentUrl' => $this->paymentUrl,
                'bookingType' => $this->bookingType,
                'currency_symbol' => $this->currencySymbol,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
