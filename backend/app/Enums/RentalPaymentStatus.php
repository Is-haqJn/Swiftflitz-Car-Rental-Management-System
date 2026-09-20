<?php

namespace App\Enums;

enum RentalPaymentStatus: string
{
    case Pending = 'pending';
    case PartiallyPaid = 'partially_paid';
    case Paid = 'paid';
    case Refunded = 'refunded';
    case Overdue = 'overdue';
}
