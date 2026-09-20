<?php

namespace App\Services\Contracts\Notifications;

interface SmsProviderInterface
{
    /**
     * Send an SMS to the given phone number.
     * Returns true on success, false on failure.
     */
    public function send(string $to, string $message): bool;

    /**
     * Whether this provider has all required credentials configured.
     */
    public function isConfigured(): bool;

    /**
     * A human-readable identifier for this provider (e.g. 'twilio').
     */
    public function getName(): string;
}
