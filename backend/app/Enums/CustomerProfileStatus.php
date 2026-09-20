<?php

namespace App\Enums;

enum CustomerProfileStatus: string
{
    case Incomplete = 'incomplete';
    case PendingReview = 'pending_review';
    case Verified = 'verified';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Incomplete => 'Incomplete',
            self::PendingReview => 'Pending Review',
            self::Verified => 'Verified',
            self::Rejected => 'Rejected',
        };
    }
}
