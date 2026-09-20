<?php

namespace App\Services\Notifications\Channels;

use App\Services\Contracts\Notifications\NotificationChannelInterface;
use App\Settings\WhatsAppSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppChannel implements NotificationChannelInterface
{
    public function __construct(private readonly WhatsAppSettings $settings) {}

    /**
     * Send a text message via Meta WhatsApp Cloud API.
     *
     * Only works for session messages (within 24h of a customer-initiated conversation).
     * For business-initiated messages, use sendTemplate() instead.
     *
     * @param  array<string, mixed>  $data
     */
    public function send(string $to, string $message, array $data = []): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        $version = config('services.whatsapp.graph_api_version', 'v25.0');
        $url = "https://graph.facebook.com/{$version}/{$this->settings->phone_number_id}/messages";

        try {
            $response = Http::withToken($this->settings->access_token)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'to' => $to,
                    'type' => 'text',
                    'text' => ['body' => $message],
                ]);

            if (! $response->successful()) {
                Log::warning('WhatsApp message failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'error' => $response->json('error'),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('WhatsApp channel exception', ['to' => $to, 'error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Send a template message via Meta WhatsApp Cloud API (v25.0+).
     *
     * Required for business-initiated messages. The template must be approved
     * in Meta WhatsApp Manager. Use positional params {{1}}, {{2}} in the template body.
     *
     * @param  array<int, string>  $bodyParams  Ordered values for {{1}}, {{2}}, etc.
     */
    public function sendTemplate(string $to, string $templateName, string $languageCode = 'en_US', array $bodyParams = []): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        $version = config('services.whatsapp.graph_api_version', 'v25.0');
        $url = "https://graph.facebook.com/{$version}/{$this->settings->phone_number_id}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => $languageCode],
            ],
        ];

        if (! empty($bodyParams)) {
            $payload['template']['components'] = [
                [
                    'type' => 'body',
                    'parameters' => array_map(
                        fn (string $value) => ['type' => 'text', 'text' => $value],
                        array_values($bodyParams),
                    ),
                ],
            ];
        }

        try {
            $response = Http::withToken($this->settings->access_token)->post($url, $payload);

            if (! $response->successful()) {
                Log::warning('WhatsApp template send failed', [
                    'to' => $to,
                    'template' => $templateName,
                    'status' => $response->status(),
                    'error' => $response->json('error'),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('WhatsApp template send exception', [
                'to' => $to,
                'template' => $templateName,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function isEnabled(): bool
    {
        return $this->settings->enabled
            && ! empty($this->settings->access_token)
            && ! empty($this->settings->phone_number_id);
    }

    public function getName(): string
    {
        return 'whatsapp';
    }
}
