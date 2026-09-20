<?php

namespace App\Mail;

use App\Enums\RentalPaymentStatus;
use App\Models\Rental;
use App\Settings\GeneralSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentalInvoiceMail extends Mailable implements ShouldQueue
{
    use SerializesModels;

    public string $queue = 'email';

    public bool $isPaid;

    public function __construct(public readonly Rental $rental, public readonly ?string $note = null)
    {
        $this->isPaid = (float) $rental->total_cost > 0
            && $rental->payment_status === RentalPaymentStatus::Paid;
    }

    public function envelope(): Envelope
    {
        $docType = $this->rental->payment_status?->value === 'paid' ? 'Receipt' : 'Invoice';
        $vehicleName = trim(($this->rental->vehicle?->make ?? '') . ' ' . ($this->rental->vehicle?->model ?? ''));

        return new Envelope(
            subject: "{$docType} for Rental #{$this->rental->reference}" . ($vehicleName ? " - {$vehicleName}" : ''),
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.rental-invoice');
    }

    public function attachments(): array
    {
        $rental = $this->rental;
        $docType = $rental->payment_status?->value === 'paid' ? 'receipt' : 'invoice';

        $pdfBytes = Pdf::loadView('pdf.rental-invoice', [
            'rental' => $rental,
            'generalSettings' => app(GeneralSettings::class),
        ])->output();

        return [
            Attachment::fromData(fn () => $pdfBytes, "{$docType}-{$rental->reference}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
