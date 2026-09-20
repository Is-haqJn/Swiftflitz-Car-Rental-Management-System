<?php

namespace App\Services\Notifications\Channels\Sms;

use App\Services\Contracts\Notifications\SmsProviderInterface;
use App\Settings\SmsSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class NaloSmsAdapter implements SmsProviderInterface
{
    public function __construct(private readonly SmsSettings $settings) {}

    public function send(string $to, string $message): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $baseUrl = config('services.sms.nalo_base_url', 'https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo');
        $url = rtrim($baseUrl, '/') . '/send-message/';

        try {
            $response = Http::get($url, [
                'key' => $this->settings->nalo_api_key,
                'source' => $this->settings->nalo_sender_id,
                'destination' => $to,
                'message' => $message,
                'type' => '0',
                'dlr' => '1',
            ]);

            $body = trim($response->body());

            if (! str_starts_with($body, '1701')) {
                Log::warning('Nalo SMS failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'response' => $body,
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Nalo SMS exception', ['to' => $to, 'error' => $e->getMessage()]);

            return false;
        }
    }

    public function isConfigured(): bool
    {
        return ! empty($this->settings->nalo_api_key)
            && ! empty($this->settings->nalo_sender_id);
    }

    public function getName(): string
    {
        return 'nalo';
    }
}
