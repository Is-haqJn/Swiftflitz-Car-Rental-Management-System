<?php

namespace App\Enums;

enum CouponBehaviourType: string
{
    case Standard = 'standard';
    case FirstTime = 'first_time';

    /** @return array<string> */
    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Standard => 'Standard',
            self::FirstTime => 'First-Time Customer',
        };
    }
}
