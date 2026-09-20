<?php

namespace App\Enums;

enum ChargeType: string
{
    case Flat = 'flat';
    case PerDay = 'per_day';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Flat => 'Flat',
            self::PerDay => 'Per Day',
        };
    }
}
