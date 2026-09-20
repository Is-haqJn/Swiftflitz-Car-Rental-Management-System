<?php

namespace App\Enums;

enum ChauffeurPaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Refunded = 'refunded';
    case Waived = 'waived';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Refunded => 'Refunded',
            self::Waived => 'Waived',
        };
    }
}
