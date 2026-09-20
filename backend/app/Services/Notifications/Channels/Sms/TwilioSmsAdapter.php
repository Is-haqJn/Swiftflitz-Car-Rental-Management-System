<?php

namespace App\Services\Notifications\Channels\Sms;

use App\Services\Contracts\Notifications\SmsProviderInterface;
use App\Settings\SmsSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TwilioSmsAdapter implements SmsProviderInterface
{
    public function __construct(private readonly SmsSettings $settings) {}

    public function send(string $to, string $message): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->settings->twilio_account_sid}/Messages.json";

        try {
            $response = Http::withBasicAuth(
                $this->settings->twilio_account_sid,
                $this->settings->twilio_auth_token
            )->asForm()->post($url, [
                'To' => $to,
                'From' => $this->settings->twilio_from_number,
                'Body' => $message,
            ]);

            if (! $response->successful()) {
                Log::warning('Twilio SMS failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'error' => $response->json(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Twilio SMS exception', ['to' => $to, 'error' => $e->getMessage()]);

            return false;
        }
    }

    public function isConfigured(): bool
    {
        return ! empty($this->settings->twilio_account_sid)
            && ! empty($this->settings->twilio_auth_token)
            && ! empty($this->settings->twilio_from_number);
    }

    public function getName(): string
    {
        return 'twilio';
    }
}
