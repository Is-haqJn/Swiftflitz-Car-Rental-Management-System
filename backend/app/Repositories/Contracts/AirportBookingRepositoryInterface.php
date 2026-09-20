<?php

namespace App\Repositories\Contracts;

use App\Models\AirportBooking;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AirportBookingRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findBooking(string $id): AirportBooking;

    public function generateReference(): string;

    public function createBooking(array $data): AirportBooking;

    public function updateBooking(string $id, array $data): AirportBooking;

    public function deleteBooking(string $id): bool;

    /**
     * Count bookings whose booking_status is in the given list, optionally scoped to branches.
     *
     * @param  array<string>  $statuses
     * @param  array<int|string>  $branchIds  Empty = no branch filter (global).
     */
    public function countByStatuses(array $statuses, array $branchIds = []): int;

    /**
     * Count bookings created within a date range, excluding a given status, optionally scoped to branches.
     *
     * @param  array<int|string>  $branchIds
     */
    public function countInPeriod(\Carbon\CarbonInterface $from, \Carbon\CarbonInterface $to, string $excludeStatus, array $branchIds = []): int;
}
