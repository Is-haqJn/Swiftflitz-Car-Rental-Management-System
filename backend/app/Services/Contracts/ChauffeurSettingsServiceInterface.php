<?php

namespace App\Services\Contracts;

use App\Settings\ChauffeurSettings;

interface ChauffeurSettingsServiceInterface
{
    /**
     * Get the full chauffeur settings as an array.
     *
     * @return array<string, mixed>
     */
    public function getSettings(ChauffeurSettings $settings): array;

    /**
     * Get only the public-safe subset of chauffeur settings.
     *
     * @return array<string, mixed>
     */
    public function getPublicSettings(ChauffeurSettings $settings): array;

    /**
     * Update chauffeur settings and persist them.
     */
    public function updateSettings(ChauffeurSettings $settings, array $data): ChauffeurSettings;
}
