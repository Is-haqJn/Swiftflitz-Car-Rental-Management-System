<?php

namespace App\Services;

use App\Services\Contracts\AirportCancellationSettingsServiceInterface;
use App\Settings\AirportCancellationSettings;

class AirportCancellationSettingsService implements AirportCancellationSettingsServiceInterface
{
    public function getSettings(AirportCancellationSettings $settings): array
    {
        return $settings->toArray();
    }

    public function updateSettings(AirportCancellationSettings $settings, array $data): AirportCancellationSettings
    {
        foreach ($data as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $settings;
    }
}
