<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentReuploadMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly \App\Models\Customer $customer, public readonly string $token) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Action Required: Please Reupload Your Documents',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $reuploadUrl = "{$frontendUrl}/reupload-documents/{$this->token}";

        return new Content(
            view: 'emails.document-reupload',
            with: [
                'customer' => $this->customer,
                'reuploadUrl' => $reuploadUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
