<?php

namespace App\Services\Contracts\Notifications;

interface NotificationChannelInterface
{
    /**
     * Send a message to the given recipient via this channel.
     *
     * @param  array<string, mixed>  $data
     */
    public function send(string $to, string $message, array $data = []): bool;

    /**
     * Whether this channel is currently enabled and configured.
     */
    public function isEnabled(): bool;

    /**
     * A human-readable name for this channel (e.g. "whatsapp", "sms").
     */
    public function getName(): string;
}
