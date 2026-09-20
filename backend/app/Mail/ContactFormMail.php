<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly array $submission) {}

    public function envelope(): Envelope
    {
        $name = $this->submission['first_name'] . ' ' . $this->submission['last_name'];

        return new Envelope(
            subject: "New Contact Message from {$name}",
            replyTo: [$this->submission['email']],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-form',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
