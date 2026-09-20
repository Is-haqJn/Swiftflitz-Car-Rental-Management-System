<?php

namespace App\Enums;

enum DiscountConditionType: string
{
    case None = 'none';
    case RentalDurationDays = 'rental_duration_days';
    case DaysBeforePickup = 'days_before_pickup';
    case BookingSource = 'booking_source';
    case CustomerCompletedRentals = 'customer_completed_rentals';
    case BaseAmount = 'base_amount';
    case VehicleId = 'vehicle_id';
    case CategoryId = 'category_id';

    /** @return array<string> */
    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::None => 'Always applies',
            self::RentalDurationDays => 'Min. rental duration (days)',
            self::DaysBeforePickup => 'Days booked in advance',
            self::BookingSource => 'Booking source',
            self::CustomerCompletedRentals => 'Customer completed rentals',
            self::BaseAmount => 'Min. base amount',
            self::VehicleId => 'Specific vehicle',
            self::CategoryId => 'Specific category',
        };
    }

    public function requiresValue(): bool
    {
        return $this !== self::None;
    }
}
