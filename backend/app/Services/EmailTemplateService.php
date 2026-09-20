<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Services\Contracts\EmailTemplateServiceInterface;
use Illuminate\Support\Facades\Cache;

class EmailTemplateService implements EmailTemplateServiceInterface
{
    /**
     * Render a template by key with the given variables.
     *
     * @param  array<string,string|int|null>  $variables
     * @return array{subject: string, html: string}|null
     */
    public function render(string $key, array $variables): ?array
    {
        // ? Fetch and cache the template for 5 minutes to prevent N+1 on every email send
        $template = Cache::remember(
            "email_template:{$key}",
            now()->addMinutes(5),
            fn () => EmailTemplate::query()->where('key', $key)->first()
        );

        if (! $template || ! $template->html_content) {
            return null;
        }

        $globalVariables = [
            'app_name' => config('app.name'),
            'support_email' => config('app.support_email', 'info@swiftflitz.com'),
            'year' => (string) now()->year,
        ];

        $allVariables = array_merge($globalVariables, $variables);

        return [
            'subject' => $this->replaceTokens($template->subject, $allVariables),
            'html' => $this->replaceTokens($template->html_content, $allVariables),
        ];
    }

    /**
     * Replace {{token}} placeholders in a string.
     *
     * @param  array<string,string|int|null>  $variables
     */
    public function replaceTokens(string $content, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', (string) ($value ?? ''), $content);
        }

        return $content;
    }
}
