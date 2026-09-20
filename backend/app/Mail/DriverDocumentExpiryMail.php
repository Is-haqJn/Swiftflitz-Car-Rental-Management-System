<?php

namespace App\Mail;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DriverDocumentExpiryMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Driver $driver, public readonly string $documentType, public readonly User $recipient) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Driver Document Expiry Alert - {$this->driver->full_name}",
        );
    }

    public function content(): Content
    {
        $expiryDate = $this->documentType === "driver's license"
            ? $this->driver->license_expiry_date?->format('D, d M Y')
            : $this->driver->id_expiry_date?->format('D, d M Y');

        return new Content(
            view: 'emails.driver-document-expiry',
            with: [
                'driverName' => $this->driver->full_name,
                'documentType' => $this->documentType,
                'expiryDate' => $expiryDate ?? '',
                'recipientName' => $this->recipient->name,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
