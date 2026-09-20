<?php

namespace App\Mail;

use App\Models\Customer;
use App\Settings\GeneralSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class TermsAndConditionsCopyMail extends Mailable implements ShouldQueue
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Customer $customer, public readonly string $termsContent, public readonly string $appName, public readonly ?int $rentalId = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Terms and Conditions - {$this->appName}",
        );
    }

    public function content(): Content
    {
        $paymentUrl = null;

        if ($this->rentalId) {
            $params = http_build_query([
                'name' => $this->customer->name ?? '',
                'email' => $this->customer->email ?? '',
                'phone' => $this->customer->phone ?? '',
            ]);
            $paymentUrl = rtrim(config('app.frontend_url', config('app.url')), '/')
                . '/payment/rental/' . $this->rentalId
                . '?' . $params;
        }

        return new Content(
            view: 'emails.terms-and-conditions-copy',
            with: [
                'appName' => $this->appName,
                'paymentUrl' => $paymentUrl,
            ],
        );
    }

    public function attachments(): array
    {
        if (strlen($this->termsContent) === 0) {
            return [];
        }

        try {
            $generalSettings = app(GeneralSettings::class);
            $pdfContent = preg_replace('/[^\x00-\x7F]/', '', $this->termsContent);

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
            Log::warning('TermsAndConditionsCopyMail: failed to generate PDF', [
                'error' => $e->getMessage(),
                'customer' => $this->customer->id,
            ]);

            return [];
        }
    }
}
