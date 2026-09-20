<?php

namespace App\Repositories\Contracts;

use App\Models\Customer;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use DateTimeInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

interface CustomerRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get all customers with optional filters, sorts, and includes.
     */
    public function getCustomers();

    /**
     * Get blacklisted customers.
     */
    public function getBlacklisted(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get active customers (not blacklisted).
     */
    public function getActive(int $perPage = 15): LengthAwarePaginator;

    /**
     * Find customer by email.
     */
    public function findByEmail(string $email): ?Customer;

    /**
     * Find customer by phone.
     */
    public function findByPhone(string $phone): ?Customer;

    /**
     * Find customer by license number.
     */
    public function findByLicenseNumber(string $licenseNumber): ?Customer;

    /**
     * Get total customer count.
     */
    public function getTotalCount(): int;

    /**
     * Get count of new customers within a date range.
     */
    public function getNewCount(DateTimeInterface $start, DateTimeInterface $end): int;

    /**
     * Get count of blacklisted customers.
     */
    public function getBlacklistedCount(): int;

    /**
     * Get top customers by rental count within a date range.
     *
     * @return Collection<int, Customer>
     */
    public function getTopByRentals(Carbon $start, Carbon $end, int $limit = 10): Collection;

    /**
     * Count customers with licenses expiring within a given number of days.
     */
    public function countExpiringLicenses(int $days = 30): int;

    /**
     * Count customers with expired licenses.
     */
    public function countExpiredLicenses(): int;

    /**
     * Get customers filtered for export.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Customer>
     */
    public function getForExport(array $filters): Collection;
}
