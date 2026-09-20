<?php

namespace App\Events;

use App\Models\AirportBooking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AirportBookingCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly AirportBooking $booking,
    ) {}
}
