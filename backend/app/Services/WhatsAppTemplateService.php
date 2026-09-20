<?php

namespace App\Services;

use App\Models\WhatsAppTemplate;
use App\Services\Contracts\WhatsAppTemplateServiceInterface;
use Illuminate\Support\Facades\Cache;

class WhatsAppTemplateService implements WhatsAppTemplateServiceInterface
{
    /**
     * Retrieve a WhatsApp template by key, cached for 5 minutes.
     */
    public function getTemplate(string $key): ?WhatsAppTemplate
    {
        return Cache::remember(
            "whatsapp_template:{$key}",
            now()->addMinutes(5),
            fn () => WhatsAppTemplate::query()->where('key', $key)->first()
        );
    }

    /**
     * Resolve the ordered positional body parameters for the WhatsApp API.
     *
     * The template's `variables` array is an ordered list of named keys
     * (e.g. ['customer_name', 'booking_reference']). This method maps them
     * to actual values from $namedValues, returning an ordered string array
     * ready to pass as {{1}}, {{2}}, ... in the WhatsApp template.
     *
     * @param  array<string, string|int|null>  $namedValues
     * @return array<int, string>
     */
    public function resolveParams(WhatsAppTemplate $template, array $namedValues): array
    {
        $variables = $template->variables ?? [];

        return array_map(
            fn (string $varName) => (string) ($namedValues[$varName] ?? ''),
            $variables,
        );
    }
}
