<?php

namespace App\Mail;

use App\Models\Rental;
use App\Settings\GeneralSettings;
use App\Settings\TermsSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class BookingConfirmationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental, public readonly ?string $paymentUrl = null, public readonly ?float $amountDue = null) {}

    public function envelope(): Envelope
    {
        $subject = $this->paymentUrl
            ? "Booking Received - Payment Required ({$this->rental->reference})"
            : "Booking Confirmation - {$this->rental->reference}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $this->rental->loadMissing(['customer', 'vehicle', 'branch']);

        return new Content(
            view: 'emails.booking-confirmation',
            with: [
                'paymentUrl' => $this->paymentUrl,
                'amountDue' => $this->amountDue,
                'currencySymbol' => $this->rental->currency_symbol
                    ?? $this->rental->branch?->currency_symbol
                    ?? config('swiftflitz.currency_symbol', '₵'),
            ],
        );
    }

    public function attachments(): array
    {
        try {
            $termsSettings = app(TermsSettings::class);
            $content = $termsSettings->content ?? '';

            if (strlen($content) === 0) {
                return [];
            }

            $generalSettings = app(GeneralSettings::class);
            $pdfContent = preg_replace('/[^\x00-\x7F]/', '', $content);

            $pdf = Pdf::loadView('pdf.terms-and-conditions', [
                'content' => $pdfContent,
                'appName' => $generalSettings->site_name ?: config('app.name'),
                'generatedAt' => now()->toFormattedDateString(),
            ])->output();

            return [
                Attachment::fromData(fn () => $pdf, 'Terms-and-Conditions.pdf')
                    ->withMime('application/pdf'),
            ];
        } catch (Throwable $e) {
            Log::warning('BookingConfirmationMail: failed to attach T&C PDF', [
                'error' => $e->getMessage(),
                'rental' => $this->rental->id,
            ]);

            return [];
        }
    }
}
