<?php

namespace App\Enums;

enum DiscountType: string
{
    case Percentage = 'percentage';
    case Flat = 'flat';

    /** @return array<string> */
    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'Percentage',
            self::Flat => 'Flat Rate',
        };
    }
}
