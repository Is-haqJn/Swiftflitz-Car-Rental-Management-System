<?php

namespace App\Enums;

enum VehicleTransmission: string
{
    case Automatic = 'automatic';
    case Manual = 'manual';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Automatic => 'Automatic',
            self::Manual => 'Manual',
        };
    }
}
