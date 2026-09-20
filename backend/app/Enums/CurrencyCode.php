<?php

namespace App\Enums;

enum CurrencyCode: string
{
    case GHS = 'GHS';
    case USD = 'USD';
    case EUR = 'EUR';
    case GBP = 'GBP';
    case NGN = 'NGN';
    case ZAR = 'ZAR';
    case KES = 'KES';
    case ZMW = 'ZMW';
    case XOF = 'XOF';
    case XAF = 'XAF';
    case RWF = 'RWF';
    case UGX = 'UGX';
    case TZS = 'TZS';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
