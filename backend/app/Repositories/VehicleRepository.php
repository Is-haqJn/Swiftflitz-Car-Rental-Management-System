<?php

namespace App\Repositories;

use App\Enums\VehicleStatus;
use App\Models\Vehicle;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class VehicleRepository extends QueryableRepository implements VehicleRepositoryInterface
{
    /**
     * Override base query to default-sort newest vehicles first.
     * For managers, scope to their assigned branches only.
     */
    public function query(): QueryBuilder
    {
        $base = parent::query()
            ->defaultSort('-created_at')
            ->withCount([
                'rentals as active_booking_count' => fn ($q) => $q->whereNotIn('status', ['completed', 'cancelled']),
            ]);

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereIn('branch_id', empty($branchIds) ? ['__none__'] : $branchIds);
        }

        return $base;
    }

    /**
     * Get all vehicles with optional filters, sorts, and includes.
     */
    public function getVehicles(): Collection
    {
        return $this->query()->get();
    }

    /**
     * Get a vehicle.
     */
    public function getVehicle(string $id)
    {
        return $this->query()->with('category')->findOrFail($id);
    }

    /**
     * Get featured vehicles.
     * Uses defaultIncludes: ['category', 'media']
     */
    public function getFeatured(int $limit = 10): Collection
    {
        return $this->query()
            ->where('is_featured', true)
            ->where('status', 'available')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get vehicles by category (paginated).
     * Uses defaultIncludes: ['category', 'media']
     */
    public function getByCategory(string $categoryId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->query()
            ->where('category_id', $categoryId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get vehicles by status (paginated).
     * Uses defaultIncludes: ['category', 'media']
     */
    public function getByStatus(string $status, int $perPage = 15): LengthAwarePaginator
    {
        return $this->query()
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get total vehicle count.
     */
    public function getTotalCount(): int
    {
        return $this->query()->count();
    }

    /**
     * Count vehicles by a given status.
     */
    public function countByStatus(string $status): int
    {
        return $this->query()->where('status', $status)->count();
    }

    /**
     * Get top vehicles ordered by rental count with category.
     *
     * @return Collection<int, Vehicle>
     */
    public function getTopByRentalCount(int $limit = 10): Collection
    {
        return $this->query()->with('category:id,name')->limit($limit)->get();
    }

    /**
     * Get all vehicles with their category for a given period.
     *
     * @return Collection<int, Vehicle>
     */
    public function getWithRentalCountInPeriod(Carbon $start, Carbon $end): Collection
    {
        return $this->query()->with('category')->get();
    }

    /**
     * Get vehicle counts grouped by status.
     *
     * @return array<string, int>
     */
    public function getStatusCounts(): array
    {
        // ? Load all statuses and aggregate in PHP to avoid raw SQL
        return $this->query()
            ->get(['status'])
            ->groupBy('status')
            ->map(fn ($group) => $group->count())
            ->toArray();
    }

    /**
     * Get vehicles currently in maintenance with their category.
     *
     * @return Collection<int, Vehicle>
     */
    public function getInMaintenance(): Collection
    {
        return $this->query()
            ->where('status', VehicleStatus::Maintenance->value)
            ->with('category:id,name')
            ->get();
    }

    /**
     * Get vehicles filtered for export.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Vehicle>
     */
    public function getForExport(array $filters): Collection
    {
        return $this->query()
            ->with('category:id,name')
            ->when(isset($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->get();
    }

    /**
     * Get active booking date ranges for a vehicle.
     *
     * @return array<int, array{from: string, to: string}>
     */
    public function getActiveBookingDateRanges(Vehicle $vehicle, ?string $excludeRentalId = null): array
    {
        return $vehicle->rentals()
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->when($excludeRentalId, fn ($q) => $q->where('id', '!=', $excludeRentalId))
            ->get(['pickup_date', 'return_date'])
            ->map(fn ($r) => [
                'from' => $r->pickup_date->format('Y-m-d'),
                'to' => $r->return_date->format('Y-m-d'),
            ])
            ->toArray();
    }

    /**
     * Allowed filters for vehicles.
     */
    public function getAllowedFilters(): array
    {
        return [
            'name',
            'status',
            'category_id',
            'is_featured',
            'color',
            'fuel_type',
            'transmission',
            'seats',
            'min_price',
            'max_price',
            'min_year',
            'max_year',
            'make',
            // Expiry status filters: 'expired' | 'expiring_soon' (within 30 days)
            AllowedFilter::callback('roadworthy_expiry_status', function ($query, $value) {
                if ($value === 'expired') {
                    $query->where('roadworthy_expiry_date', '<', Carbon::today());
                } elseif ($value === 'expiring_soon') {
                    $query->whereBetween('roadworthy_expiry_date', [Carbon::today(), Carbon::today()->addDays(30)]);
                }
            }),
            AllowedFilter::callback('insurance_expiry_status', function ($query, $value) {
                if ($value === 'expired') {
                    $query->where('insurance_expiry_date', '<', Carbon::today());
                } elseif ($value === 'expiring_soon') {
                    $query->whereBetween('insurance_expiry_date', [Carbon::today(), Carbon::today()->addDays(30)]);
                }
            }),
            AllowedFilter::exact('branch_id'),
        ];
    }

    /**
     * Allowed sorts for vehicles.
     */
    public function getAllowedSorts(): array
    {
        return [
            'created_at',
            'updated_at',
            'price',
            'name',
            'status',
            'category_id',
            'is_featured',
            'color',
            'fuel_type',
            'transmission',
            'seats',
            'min_year',
            'max_year',
            'roadworthy_expiry_date',
            'insurance_expiry_date',
            // Add other sortable fields as needed
        ];
    }

    /**
     * Allowed includes for vehicles.
     */
    public function getAllowedIncludes(): array
    {
        return [
            'category',
            'owner',
            'media',
            'branch',
        ];
    }

    /**
     * Allowed fields for vehicles.
     */
    public function getAllowedFields(): array
    {
        return [
            'id',
            'name',
            'status',
            'category_id',
            'featured',
            'price',
            // Add other fields as needed
        ];
    }

    /**
     * Default includes for vehicles.
     */
    public function getDefaultIncludes(): array
    {
        return [
            'category',
            'branch',
            'media',
        ];
    }
    // public string $paginatedPath = '/vehicles';

    /**
     * Specify Model class name.
     */
    protected function model(): string
    {
        return Vehicle::class;
    }
}
