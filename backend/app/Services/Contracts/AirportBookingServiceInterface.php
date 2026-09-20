<?php

namespace App\Services\Contracts;

use App\DTOs\AirportBookingData;
use App\Models\AirportBooking;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AirportBookingServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function getBooking(string $id): AirportBooking;

    public function create(AirportBookingData $data): AirportBooking;

    public function update(string $id, array $data): AirportBooking;

    public function delete(string $id): bool;

    public function confirmBooking(string $id): AirportBooking;

    public function assignDriver(string $id, array $data): AirportBooking;

    public function removeDriver(string $id): AirportBooking;

    public function startTrip(string $id): AirportBooking;

    public function completeTrip(string $id): AirportBooking;

    public function cancelBooking(string $id, array $data): AirportBooking;

    public function markNoShow(string $id): AirportBooking;

    public function recordPayment(string $id, array $data): AirportBooking;

    public function markRefunded(string $id): AirportBooking;

    public function sendPaymentLink(string $id): void;

    /** @return string[] YYYY-MM-DD dates where all branch vehicles are fully occupied */
    public function blockedDates(string $branchId, Carbon $from, Carbon $to): array;
}
