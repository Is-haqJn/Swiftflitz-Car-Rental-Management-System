<?php

namespace App\Enums;

enum RentalStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Active = 'active';
    case Overdue = 'overdue';
    case Returned = 'returned';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
