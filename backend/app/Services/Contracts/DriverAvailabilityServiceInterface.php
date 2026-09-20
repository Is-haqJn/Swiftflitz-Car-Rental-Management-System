<?php

namespace App\Services\Contracts;

use Carbon\Carbon;

interface DriverAvailabilityServiceInterface
{
    /**
     * Return true if the driver has any booking that overlaps the given window.
     *
     * @param  Carbon  $start  Window start (inclusive)
     * @param  Carbon  $end  Window end (inclusive)
     * @param  string|null  $ignoreBookingId  Exclude this booking ID from the check (for updates)
     */
    public function hasConflict(string $driverId, Carbon $start, Carbon $end, ?string $ignoreBookingId = null): bool;
}
