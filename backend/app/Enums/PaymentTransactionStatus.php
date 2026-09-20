<?php

namespace App\Enums;

enum PaymentTransactionStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case UnderReview = 'under_review';
    case Refunded = 'refunded';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Failed => 'Failed',
            self::UnderReview => 'Under Review',
            self::Refunded => 'Refunded',
        };
    }
}
