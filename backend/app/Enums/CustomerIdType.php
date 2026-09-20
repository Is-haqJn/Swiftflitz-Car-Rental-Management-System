<?php

namespace App\Enums;

enum CustomerIdType: string
{
    case GhanaCard = 'ghana_card';
    case Passport = 'passport';
    case VoterId = 'voter_id';
    case DriversLicense = 'drivers_license';
    case Nhis = 'nhis';
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
            self::VoterId => 'Voter ID',
            self::DriversLicense => "Driver's License",
            self::Nhis => 'NHIS Card',
            self::Other => 'Other',
        };
    }
}
