<?php

namespace App\Services;

use App\Services\Contracts\ChauffeurSettingsServiceInterface;
use App\Settings\ChauffeurSettings;

class ChauffeurSettingsService implements ChauffeurSettingsServiceInterface
{
    public function getSettings(ChauffeurSettings $settings): array
    {
        return $settings->toArray();
    }

    public function getPublicSettings(ChauffeurSettings $settings): array
    {
        return [
            'booking_window_start' => $settings->booking_window_start,
            'booking_window_end' => $settings->booking_window_end,
        ];
    }

    public function updateSettings(ChauffeurSettings $settings, array $data): ChauffeurSettings
    {
        foreach ($data as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $settings;
    }
}
