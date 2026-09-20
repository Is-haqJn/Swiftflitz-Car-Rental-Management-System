<?php

namespace App\Repositories\Contracts;

use App\Models\Rental;

interface RentalRepositoryInterface
{
    public function getAll(): mixed;

    public function findRental(string $id): Rental;

    public function createRental(array $data): Rental;

    public function updateRental(string $id, array $data): Rental;

    public function deleteRental(string $id): void;

    public function generateReference(): string;

    /**
     * Count rentals whose status is in the given list, optionally scoped to branches.
     *
     * @param  array<string>  $statuses
     * @param  array<int|string>  $branchIds  Empty = no branch filter (global).
     */
    public function countByStatuses(array $statuses, array $branchIds = []): int;

    /**
     * Sum of (total_cost - amount_paid) for active/confirmed/overdue rentals where balance > 0.
     *
     * @param  array<int|string>  $branchIds  Empty = no branch filter (global).
     */
    public function pendingPaymentsTotal(array $branchIds = []): float;
}
