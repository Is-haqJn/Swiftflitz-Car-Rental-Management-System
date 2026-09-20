<?php

namespace App\Enums;

enum RentalSource: string
{
    case Website = 'website';
    case Phone = 'phone';
    case WalkIn = 'walk_in';
    case Referral = 'referral';
    case QuoteRequest = 'quote_request';
}
