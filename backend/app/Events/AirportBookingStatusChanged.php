<?php

namespace App\Events;

use App\Models\AirportBooking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AirportBookingStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly AirportBooking $booking,
        public readonly string $oldStatus,
    ) {}
}
