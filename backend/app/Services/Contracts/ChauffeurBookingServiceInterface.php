<?php

namespace App\Services\Contracts;

use App\DTOs\ChauffeurBookingData;
use App\Models\ChauffeurBooking;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChauffeurBookingServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function getBooking(string $id): ChauffeurBooking;

    public function create(ChauffeurBookingData $data): ChauffeurBooking;

    public function update(string $id, array $data): ChauffeurBooking;

    public function delete(string $id): bool;

    public function confirmBooking(string $id): ChauffeurBooking;

    public function assignDriver(string $id, array $data): ChauffeurBooking;

    public function removeDriver(string $id): ChauffeurBooking;

    public function startTrip(string $id): ChauffeurBooking;

    public function completeTrip(string $id): ChauffeurBooking;

    public function cancelBooking(string $id, array $data): ChauffeurBooking;

    public function markNoShow(string $id): ChauffeurBooking;

    public function recordPayment(string $id, array $data): ChauffeurBooking;

    public function approveRefund(string $id, ?string $note = null): ChauffeurBooking;

    public function waiveRefund(string $id, ?string $note = null): ChauffeurBooking;

    public function logPickup(string $id, array $data): ChauffeurBooking;

    public function logReturn(string $id, array $data): ChauffeurBooking;

    public function sendPaymentLink(string $id): void;
}
