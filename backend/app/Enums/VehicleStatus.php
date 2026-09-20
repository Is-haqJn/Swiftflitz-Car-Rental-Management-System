<?php

namespace App\Enums;

enum VehicleStatus: string
{
    case Available = 'available';
    case Rented = 'rented';
    case Maintenance = 'maintenance';
    case Retired = 'retired';
    case PendingApproval = 'pending_approval';
    case Unavailable = 'unavailable';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Rented => 'Rented',
            self::Maintenance => 'Maintenance',
            self::Retired => 'Retired',
            self::PendingApproval => 'Pending Approval',
            self::Unavailable => 'Unavailable',
        };
    }
}
