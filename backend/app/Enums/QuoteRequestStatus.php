<?php

namespace App\Enums;

enum QuoteRequestStatus: string
{
    case Pending = 'pending';
    case Contacted = 'contacted';
    case Quoted = 'quoted';
    case Sent = 'sent';
    case PendingReview = 'pending_review';
    case Converted = 'converted';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Contacted => 'Contacted',
            self::Quoted => 'Quoted',
            self::Sent => 'Sent',
            self::PendingReview => 'Pending Review',
            self::Converted => 'Converted',
            self::Cancelled => 'Cancelled',
        };
    }
}
