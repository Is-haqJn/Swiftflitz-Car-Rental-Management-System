<?php

namespace App\Http\Controllers;

use App\Settings\WhatsAppSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /**
     * GET /webhooks/whatsapp
     * Meta hub verification handshake.
     * Called by Meta when you register or re-register the webhook URL.
     */
    public function verify(Request $request, WhatsAppSettings $settings): Response
    {
        /*
         * PHP converts dots to underscores in query string keys, so Meta's
         * hub.mode becomes hub_mode, hub.verify_token becomes hub_verify_token, etc.
         */
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        /* DB-stored token takes priority; fall back to env-based config */
        $expectedToken = $settings->webhook_verify_token ?: config('services.whatsapp.verify_token');

        if ($mode !== 'subscribe' || $token !== $expectedToken) {
            return response('Forbidden', 403);
        }

        return response((string) $challenge, 200);
    }

    /**
     * POST /webhooks/whatsapp
     * Incoming messages and status updates from Meta.
     * Must ALWAYS return 200 - Meta will retry otherwise and may disable the webhook.
     */
    public function handle(Request $request, WhatsAppSettings $settings): Response
    {
        /* DB-stored secret takes priority; fall back to env-based config */
        $appSecret = $settings->app_secret ?: config('services.whatsapp.app_secret');

        if (! empty($appSecret)) {
            $signature = $request->header('X-Hub-Signature-256', '');
            $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);

            if (! hash_equals($expected, $signature)) {
                Log::warning('WhatsApp webhook: invalid signature');

                return response('Forbidden', 403);
            }
        }

        $object = $request->input('object');

        /* Only process whatsapp_business_account events - silently ack anything else */
        if ($object !== 'whatsapp_business_account') {
            return response('OK', 200);
        }

        foreach ($request->input('entry', []) as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'messages') {
                    continue;
                }

                $value = $change['value'] ?? [];

                $this->processMessages($value['messages'] ?? []);
                $this->processStatuses($value['statuses'] ?? []);
            }
        }

        return response('OK', 200);
    }

    /**
     * Log incoming customer messages.
     *
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function processMessages(array $messages): void
    {
        foreach ($messages as $message) {
            Log::info('WhatsApp incoming message', [
                'from' => $message['from'] ?? null,
                'type' => $message['type'] ?? null,
                'text' => $message['text']['body'] ?? null,
                'timestamp' => $message['timestamp'] ?? null,
                'message_id' => $message['id'] ?? null,
            ]);
        }
    }

    /**
     * Log delivery/read status updates for outbound messages.
     *
     * @param  array<int, array<string, mixed>>  $statuses
     */
    private function processStatuses(array $statuses): void
    {
        foreach ($statuses as $status) {
            $context = [
                'recipient' => $status['recipient_id'] ?? null,
                'status' => $status['status'] ?? null,
                'timestamp' => $status['timestamp'] ?? null,
                'message_id' => $status['id'] ?? null,
            ];

            if (! empty($status['errors'])) {
                $context['errors'] = $status['errors'];
                Log::warning('WhatsApp message delivery failed', $context);
            } else {
                Log::info('WhatsApp message status update', $context);
            }
        }
    }
}
