<?php

namespace App\Services\Contracts;

use Illuminate\Support\Collection;

interface VehicleAvailabilityServiceInterface
{
    /**
     * Return all active future booking intervals for the given fleet vehicle (chauffeur use case).
     *
     * @return Collection<int, array{start: string, end: string}>
     */
    public function getBookedIntervals(string $vehicleId): Collection;

    /**
     * Return all active future booking date ranges for a vehicle, covering
     * regular rentals, chauffeur bookings, and airport transfers.
     *
     * @return Collection<int, array{from: string, to: string}>
     */
    public function getUnavailableDateRanges(string $vehicleId): Collection;

    /**
     * Batch version keyed by vehicle ID - 3 queries regardless of vehicle count.
     *
     * @param  string[]  $vehicleIds
     * @return Collection<string, Collection<int, array{from: string, to: string}>>
     */
    public function getBatchUnavailableDateRanges(array $vehicleIds): Collection;
}
