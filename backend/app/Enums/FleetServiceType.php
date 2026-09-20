<?php

namespace App\Enums;

enum FleetServiceType: string
{
    case Airport = 'airport';
    case Chauffeur = 'chauffeur';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Airport => 'Airport Transfer',
            self::Chauffeur => 'Chauffeur',
        };
    }
}
