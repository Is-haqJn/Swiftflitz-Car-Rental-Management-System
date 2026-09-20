<?php

namespace App\Services\Notifications\Channels\Sms;

use App\Services\Contracts\Notifications\SmsProviderInterface;
use App\Settings\SmsSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ArkesselSmsAdapter implements SmsProviderInterface
{
    public function __construct(private readonly SmsSettings $settings) {}

    public function send(string $to, string $message): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $url = config('services.sms.arkesel_base_url', 'https://sms.arkesel.com/api/v2') . '/sms/send';

        try {
            $response = Http::withHeader('api-key', $this->settings->arkessel_api_key)
                ->post($url, [
                    'sender' => $this->settings->arkessel_sender_id,
                    'message' => $message,
                    'recipients' => [$to],
                ]);

            if (! $response->successful()) {
                Log::warning('Arkesel SMS failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'error' => $response->json(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Arkesel SMS exception', ['to' => $to, 'error' => $e->getMessage()]);

            return false;
        }
    }

    public function isConfigured(): bool
    {
        return ! empty($this->settings->arkessel_api_key)
            && ! empty($this->settings->arkessel_sender_id);
    }

    public function getName(): string
    {
        return 'arkessel';
    }
}
