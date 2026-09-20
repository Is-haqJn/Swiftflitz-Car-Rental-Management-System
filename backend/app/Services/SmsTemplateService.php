<?php

namespace App\Services;

use App\Models\SmsTemplate;
use App\Services\Contracts\SmsTemplateServiceInterface;
use Illuminate\Support\Facades\Cache;

class SmsTemplateService implements SmsTemplateServiceInterface
{
    /**
     * Retrieve an SMS template by key, cached for 5 minutes.
     */
    public function getTemplate(string $key): ?SmsTemplate
    {
        return Cache::remember(
            "sms_template:{$key}",
            now()->addMinutes(5),
            fn () => SmsTemplate::query()->where('key', $key)->first()
        );
    }

    /**
     * Render the template body by replacing {{named_var}} tokens with values.
     *
     * @param  array<string, string|int|null>  $namedValues
     */
    public function render(SmsTemplate $template, array $namedValues): string
    {
        $body = $template->body;

        foreach ($namedValues as $key => $value) {
            $body = str_replace('{{' . $key . '}}', (string) ($value ?? ''), $body);
        }

        return $body;
    }
}
