<?php

namespace App\Enums;

enum ChargeScope: string
{
    case Global = 'global';
    case Category = 'category';
    case Vehicle = 'vehicle';
    case Regular = 'regular';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Global => 'Global',
            self::Category => 'Category',
            self::Vehicle => 'Vehicle',
            self::Regular => 'Regular',
        };
    }
}
