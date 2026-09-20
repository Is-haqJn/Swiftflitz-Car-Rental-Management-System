<?php

namespace App\Enums;

enum CouponScopeType: string
{
    case Rental = 'rental';
    case Chauffeur = 'chauffeur';
    case Airport = 'airport';
    case AirportPackage = 'airport_package';
    case Vehicle = 'vehicle';
    case FleetVehicle = 'fleet_vehicle';
    case Category = 'category';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }
}
