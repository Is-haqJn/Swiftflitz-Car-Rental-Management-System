<?php

namespace App\Services\Notifications\Channels\Sms;

use App\Services\Contracts\Notifications\SmsProviderInterface;
use App\Settings\SmsSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class HubtelSmsAdapter implements SmsProviderInterface
{
    public function __construct(private readonly SmsSettings $settings) {}

    public function send(string $to, string $message): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::withBasicAuth(
                $this->settings->hubtel_sms_client_id,
                $this->settings->hubtel_sms_client_secret,
            )->post('https://sms.hubtel.com/v1/messages/send', [
                'From' => $this->settings->hubtel_sms_sender_id,
                'To' => $to,
                'Content' => $message,
            ]);

            if (! $response->successful() || $response->json('status') !== 0) {
                Log::warning('Hubtel SMS failed', [
                    'to' => $to,
                    'http_status' => $response->status(),
                    'response' => $response->json(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Hubtel SMS exception', ['to' => $to, 'error' => $e->getMessage()]);

            return false;
        }
    }

    public function isConfigured(): bool
    {
        return ! empty($this->settings->hubtel_sms_client_id)
            && ! empty($this->settings->hubtel_sms_client_secret)
            && ! empty($this->settings->hubtel_sms_sender_id);
    }

    public function getName(): string
    {
        return 'hubtel';
    }
}
