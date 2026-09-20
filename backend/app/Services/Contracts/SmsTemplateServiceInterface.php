<?php

namespace App\Services\Contracts;

use App\Models\SmsTemplate;

interface SmsTemplateServiceInterface
{
    /**
     * Retrieve an SMS template by its internal key, with caching.
     */
    public function getTemplate(string $key): ?SmsTemplate;

    /**
     * Render the template body by replacing named tokens with values.
     *
     * @param  array<string, string|int|null>  $namedValues
     */
    public function render(SmsTemplate $template, array $namedValues): string;
}
