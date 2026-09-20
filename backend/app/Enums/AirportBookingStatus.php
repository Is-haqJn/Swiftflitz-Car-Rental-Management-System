<?php

namespace App\Enums;

enum AirportBookingStatus: string
{
    case Pending = 'pending';
    case PaymentReceived = 'payment_received';
    case Confirmed = 'confirmed';
    case DriverAssigned = 'driver_assigned';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::PaymentReceived => 'Payment Received',
            self::Confirmed => 'Confirmed',
            self::DriverAssigned => 'Driver Assigned',
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::NoShow => 'No Show',
        };
    }
}
