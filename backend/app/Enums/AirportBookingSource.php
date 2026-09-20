<?php

namespace App\Enums;

enum AirportBookingSource: string
{
    case Online = 'online';
    case Staff = 'staff';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online',
            self::Staff => 'Staff',
        };
    }
}
