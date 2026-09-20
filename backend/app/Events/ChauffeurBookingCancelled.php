<?php

namespace App\Events;

use App\Models\ChauffeurBooking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChauffeurBookingCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly ChauffeurBooking $booking,
    ) {}
}
