<?php

namespace App\Services\Contracts;

use App\Models\WhatsAppTemplate;

interface WhatsAppTemplateServiceInterface
{
    /**
     * Retrieve a WhatsApp template by its internal key, with caching.
     */
    public function getTemplate(string $key): ?WhatsAppTemplate;

    /**
     * Resolve the ordered positional parameters for the WhatsApp API
     * by mapping the template's variables array to actual values.
     *
     * @param  array<string, string|int|null>  $namedValues
     * @return array<int, string>
     */
    public function resolveParams(WhatsAppTemplate $template, array $namedValues): array;
}
