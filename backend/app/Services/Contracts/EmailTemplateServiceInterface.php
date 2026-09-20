<?php

namespace App\Services\Contracts;

interface EmailTemplateServiceInterface
{
    /**
     * Render a template by key with the given variables.
     * Returns ['subject' => '...', 'html' => '...'] or null if no custom template exists.
     *
     * @param  array<string,string|int|null>  $variables
     * @return array{subject: string, html: string}|null
     */
    public function render(string $key, array $variables): ?array;

    /**
     * Replace tokens in a string with their values.
     *
     * @param  array<string,string|int|null>  $variables
     */
    public function replaceTokens(string $content, array $variables): string;
}
