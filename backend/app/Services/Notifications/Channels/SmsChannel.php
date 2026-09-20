<?php

namespace App\Services\Notifications\Channels;

use App\Services\Contracts\Notifications\NotificationChannelInterface;
use App\Services\Contracts\Notifications\SmsProviderInterface;
use App\Services\Notifications\Channels\Sms\ArkesselSmsAdapter;
use App\Services\Notifications\Channels\Sms\HubtelSmsAdapter;
use App\Services\Notifications\Channels\Sms\NaloSmsAdapter;
use App\Services\Notifications\Channels\Sms\TwilioSmsAdapter;
use App\Settings\SmsSettings;

class SmsChannel implements NotificationChannelInterface
{
    public function __construct(
        private readonly SmsSettings $settings,
        private readonly TwilioSmsAdapter $twilio,
        private readonly ArkesselSmsAdapter $arkessel,
        private readonly NaloSmsAdapter $nalo,
        private readonly HubtelSmsAdapter $hubtel,
    ) {}

    /**
     * Send an SMS via the configured provider.
     *
     * @param  array<string, mixed>  $data
     */
    public function send(string $to, string $message, array $data = []): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        return $this->resolveProvider()->send($to, $message);
    }

    public function isEnabled(): bool
    {
        return $this->settings->enabled && $this->resolveProvider()->isConfigured();
    }

    public function getName(): string
    {
        return 'sms';
    }

    /**
     * Return the active provider adapter based on SmsSettings::$default_provider.
     * Falls back to Twilio if the value is unrecognised.
     */
    private function resolveProvider(): SmsProviderInterface
    {
        return match ($this->settings->default_provider) {
            'arkessel' => $this->arkessel,
            'nalo' => $this->nalo,
            'hubtel' => $this->hubtel,
            default => $this->twilio,
        };
    }
}
