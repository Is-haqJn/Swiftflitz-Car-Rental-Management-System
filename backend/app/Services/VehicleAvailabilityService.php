<?php

namespace App\Services;

use App\Enums\AirportBookingStatus;
use App\Enums\ChauffeurBookingStatus;
use App\Enums\RentalStatus;
use App\Services\Contracts\VehicleAvailabilityServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VehicleAvailabilityService implements VehicleAvailabilityServiceInterface
{
    private const CHAUFFEUR_INACTIVE = [
        ChauffeurBookingStatus::Completed->value,
        ChauffeurBookingStatus::Cancelled->value,
        ChauffeurBookingStatus::NoShow->value,
    ];

    private const RENTAL_INACTIVE = [
        RentalStatus::Returned->value,
        RentalStatus::Completed->value,
        RentalStatus::Cancelled->value,
    ];

    private const AIRPORT_INACTIVE = [
        AirportBookingStatus::Completed->value,
        AirportBookingStatus::Cancelled->value,
        AirportBookingStatus::NoShow->value,
    ];

    /**
     * Return all active future booking intervals for the given fleet vehicle (chauffeur use case).
     *
     * @return Collection<int, array{start: string, end: string}>
     */
    public function getBookedIntervals(string $vehicleId): Collection
    {
        return DB::table('chauffeur_bookings')
            ->whereNull('deleted_at')
            ->where('vehicle_id', $vehicleId)
            ->whereNotIn('booking_status', self::CHAUFFEUR_INACTIVE)
            ->where('return_time', '>', now()->toDateTimeString())
            ->orderBy('pickup_time')
            ->get(['pickup_time', 'return_time'])
            ->map(fn ($row) => [
                'start' => $row->pickup_time,
                'end' => $row->return_time,
            ]);
    }

    /**
     * Return all active future booking date ranges for a vehicle, covering
     * regular rentals, chauffeur bookings, and airport transfers.
     *
     * @return Collection<int, array{from: string, to: string}>
     */
    public function getUnavailableDateRanges(string $vehicleId): Collection
    {
        return $this->fetchRangesForVehicles([$vehicleId])
            ->get($vehicleId, collect())
            ->values();
    }

    /**
     * Batch version keyed by vehicle ID - 3 queries regardless of vehicle count.
     *
     * @param  string[]  $vehicleIds
     * @return Collection<string, Collection<int, array{from: string, to: string}>>
     */
    public function getBatchUnavailableDateRanges(array $vehicleIds): Collection
    {
        return $this->fetchRangesForVehicles($vehicleIds);
    }

    /**
     * @param  string[]  $vehicleIds
     * @return Collection<string, Collection<int, array{from: string, to: string}>>
     */
    private function fetchRangesForVehicles(array $vehicleIds): Collection
    {
        $today = now()->toDateString();
        $now = now()->toDateTimeString();

        $rentals = DB::table('rentals')
            ->whereNull('deleted_at')
            ->whereIn('vehicle_id', $vehicleIds)
            ->whereNotIn('status', self::RENTAL_INACTIVE)
            ->where('return_date', '>=', $today)
            ->get(['vehicle_id', 'pickup_date', 'return_date']);

        $chauffeurs = DB::table('chauffeur_bookings')
            ->whereNull('deleted_at')
            ->whereIn('vehicle_id', $vehicleIds)
            ->whereNotIn('booking_status', self::CHAUFFEUR_INACTIVE)
            ->where('return_time', '>=', $now)
            ->get(['vehicle_id', 'pickup_time', 'return_time']);

        $airports = DB::table('airport_bookings')
            ->whereNull('deleted_at')
            ->whereIn('vehicle_id', $vehicleIds)
            ->whereNotIn('booking_status', self::AIRPORT_INACTIVE)
            ->where('scheduled_at', '>=', $today)
            ->get(['vehicle_id', 'scheduled_at']);

        $result = collect($vehicleIds)->mapWithKeys(fn ($id) => [$id => collect()]);

        foreach ($rentals as $r) {
            $result[$r->vehicle_id]->push([
                'from' => $r->pickup_date,
                'to' => $r->return_date,
            ]);
        }

        foreach ($chauffeurs as $c) {
            $result[$c->vehicle_id]->push([
                'from' => Carbon::parse($c->pickup_time)->format('Y-m-d'),
                'to' => Carbon::parse($c->return_time)->format('Y-m-d'),
            ]);
        }

        foreach ($airports as $a) {
            $day = Carbon::parse($a->scheduled_at)->format('Y-m-d');
            $result[$a->vehicle_id]->push([
                'from' => $day,
                'to' => $day,
            ]);
        }

        return $result;
    }
}
