<?php

namespace App\Enums;

enum AirportBookingDirection: string
{
    case Pickup = 'pickup';
    case Dropoff = 'dropoff';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Pickup => 'Airport Pickup',
            self::Dropoff => 'Airport Dropoff',
        };
    }
}
