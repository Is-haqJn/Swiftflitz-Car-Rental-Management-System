<?php

namespace App\Enums;

enum FleetVehicleStatus: string
{
    case Available = 'available';
    case OnTrip = 'on_trip';
    case Maintenance = 'maintenance';
    case Inactive = 'inactive';
    case Retired = 'retired';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::OnTrip => 'On Trip',
            self::Maintenance => 'Maintenance',
            self::Inactive => 'Inactive',
            self::Retired => 'Retired',
        };
    }
}
