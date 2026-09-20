<?php

namespace App\Enums;

enum DriverStatus: string
{
    case Available = 'available';
    case OnTrip = 'on_trip';
    case OffDuty = 'off_duty';
    case Suspended = 'suspended';
    case Inactive = 'inactive';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::OnTrip => 'On Trip',
            self::OffDuty => 'Off Duty',
            self::Suspended => 'Suspended',
            self::Inactive => 'Inactive',
        };
    }
}
