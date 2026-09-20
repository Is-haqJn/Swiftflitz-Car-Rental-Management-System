<?php

namespace App\Enums;

enum AirportAssignmentMode: string
{
    case Manual = 'manual';
    case Automatic = 'automatic';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Automatic => 'Automatic',
        };
    }
}
