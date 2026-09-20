<?php

namespace App\Services;

use App\Services\Contracts\DriverAvailabilityServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DriverAvailabilityService implements DriverAvailabilityServiceInterface
{
    /** Airport bookings have no explicit end time - assume this many hours duration. */
    private const AIRPORT_BOOKING_DURATION_HOURS = 2;

    /** Statuses that no longer occupy the driver's time. */
    private const INACTIVE_STATUSES = ['completed', 'cancelled', 'no_show'];

    public function hasConflict(string $driverId, Carbon $start, Carbon $end, ?string $ignoreBookingId = null): bool
    {
        return $this->hasChauffeurConflict($driverId, $start, $end, $ignoreBookingId)
            || $this->hasAirportConflict($driverId, $start, $end, $ignoreBookingId);
    }

    private function hasChauffeurConflict(string $driverId, Carbon $start, Carbon $end, ?string $ignoreBookingId): bool
    {
        $query = DB::table('chauffeur_bookings')
            ->whereNull('deleted_at')
            ->where('driver_id', $driverId)
            ->whereNotIn('booking_status', self::INACTIVE_STATUSES)
            // Overlap: existing.pickup_time < $end AND existing.return_time > $start
            ->where('pickup_time', '<', $end->toDateTimeString())
            ->where('return_time', '>', $start->toDateTimeString());

        if ($ignoreBookingId !== null) {
            $query->where('id', '!=', $ignoreBookingId);
        }

        return $query->exists();
    }

    private function hasAirportConflict(string $driverId, Carbon $start, Carbon $end, ?string $ignoreBookingId): bool
    {
        // Airport booking window: [scheduled_at, scheduled_at + DURATION]
        // Overlap with [$start, $end]:
        //   scheduled_at < $end  AND  scheduled_at > $start - DURATION
        $earliestStart = $start->copy()->subHours(self::AIRPORT_BOOKING_DURATION_HOURS);

        $query = DB::table('airport_bookings')
            ->whereNull('deleted_at')
            ->where('driver_id', $driverId)
            ->whereNotIn('booking_status', self::INACTIVE_STATUSES)
            ->where('scheduled_at', '<', $end->toDateTimeString())
            ->where('scheduled_at', '>', $earliestStart->toDateTimeString());

        if ($ignoreBookingId !== null) {
            $query->where('id', '!=', $ignoreBookingId);
        }

        return $query->exists();
    }
}
