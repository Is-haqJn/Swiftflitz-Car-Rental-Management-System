<?php

namespace App\Repositories\Contracts;

use App\Models\Vehicle;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

interface VehicleRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get all vehicles with optional filters, sorts, and includes.
     */
    public function getVehicles();

    /**
     * Get a vehicle.
     */
    public function getVehicle(string $id);

    /**
     * Get featured vehicles.
     */
    public function getFeatured(int $limit = 10): Collection;

    /**
     * Get vehicles by category (paginated).
     */
    public function getByCategory(string $categoryId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get vehicles by status (paginated).
     */
    public function getByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get total vehicle count.
     */
    public function getTotalCount(): int;

    /**
     * Count vehicles by a given status.
     */
    public function countByStatus(string $status): int;

    /**
     * Get top vehicles ordered by rental count.
     *
     * @return Collection<int, Vehicle>
     */
    public function getTopByRentalCount(int $limit = 10): Collection;

    /**
     * Get all vehicles with rental counts for a given period.
     *
     * @return Collection<int, Vehicle>
     */
    public function getWithRentalCountInPeriod(Carbon $start, Carbon $end): Collection;

    /**
     * Get vehicle counts grouped by status.
     *
     * @return array<string, int>
     */
    public function getStatusCounts(): array;

    /**
     * Get vehicles currently in maintenance.
     *
     * @return Collection<int, Vehicle>
     */
    public function getInMaintenance(): Collection;

    /**
     * Get vehicles filtered for export.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Vehicle>
     */
    public function getForExport(array $filters): Collection;

    /**
     * Get active booking date ranges for a vehicle.
     *
     * @return array<int, array{from: string, to: string}>
     */
    public function getActiveBookingDateRanges(Vehicle $vehicle, ?string $excludeRentalId = null): array;
}
