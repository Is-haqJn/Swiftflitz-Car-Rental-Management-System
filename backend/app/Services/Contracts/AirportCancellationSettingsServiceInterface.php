<?php

namespace App\Services\Contracts;

use App\Settings\AirportCancellationSettings;

interface AirportCancellationSettingsServiceInterface
{
    /**
     * Get the current airport cancellation settings as an array.
     *
     * @return array<string, mixed>
     */
    public function getSettings(AirportCancellationSettings $settings): array;

    /**
     * Update airport cancellation settings and persist them.
     */
    public function updateSettings(AirportCancellationSettings $settings, array $data): AirportCancellationSettings;
}
