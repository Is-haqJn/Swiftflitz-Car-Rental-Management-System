<?php

namespace App\Enums;

enum DriverIdType: string
{
    case GhanaCard = 'ghana_card';
    case Passport = 'passport';
    case VotersId = 'voters_id';
    case DriversLicense = 'drivers_license';
    case Ssnit = 'ssnit';
    case Other = 'other';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::GhanaCard => 'Ghana Card',
            self::Passport => 'Passport',
            self::VotersId => 'Voters ID',
            self::DriversLicense => 'Drivers License',
            self::Ssnit => 'SSNIT',
            self::Other => 'Other',
        };
    }
}
