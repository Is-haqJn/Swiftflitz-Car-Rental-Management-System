<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use DateTimeInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerRepository extends QueryableRepository implements CustomerRepositoryInterface
{
    /**
     * Override base query to scope results to the authenticated user's branches.
     * Super admins and admins see all customers.
     */
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereHas('branches', fn ($q) => $q->whereIn('branches.id', empty($branchIds) ? ['__none__'] : $branchIds)
            );
        }

        return $base;
    }

    public function getCustomers()
    {
        return $this->getFiltered();
    }

    public function getBlacklisted(int $perPage = 15): LengthAwarePaginator
    {
        return $this->query()->where('is_blacklisted', true)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)->withPath($this->paginatedPath);
    }

    public function getActive(int $perPage = 15): LengthAwarePaginator
    {
        return $this->query()->where('is_blacklisted', false)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)->withPath($this->paginatedPath);
    }

    public function findByEmail(string $email): ?Customer
    {
        return $this->model->where('email', $email)->first();
    }

    public function findByPhone(string $phone): ?Customer
    {
        return $this->model->where('phone', $phone)->first();
    }

    public function findByLicenseNumber(string $licenseNumber): ?Customer
    {
        return $this->model->where('license_number', $licenseNumber)->first();
    }

    /**
     * Get total customer count.
     */
    public function getTotalCount(): int
    {
        return $this->query()->count();
    }

    /**
     * Get count of new customers within a date range.
     */
    public function getNewCount(DateTimeInterface $start, DateTimeInterface $end): int
    {
        return $this->query()->whereBetween('created_at', [$start, $end])->count();
    }

    /**
     * Get count of blacklisted customers.
     */
    public function getBlacklistedCount(): int
    {
        return $this->query()->where('is_blacklisted', true)->count();
    }

    /**
     * Get top customers by rental count within a date range.
     *
     * @return Collection<int, Customer>
     */
    public function getTopByRentals(Carbon $start, Carbon $end, int $limit = 10): Collection
    {
        return $this->query()->limit($limit)->get(['id', 'name', 'email', 'phone']);
    }

    /**
     * Count customers with licenses expiring within a given number of days.
     */
    public function countExpiringLicenses(int $days = 30): int
    {
        return $this->query()
            ->whereBetween('license_expiry_date', [now(), now()->addDays($days)])
            ->count();
    }

    /**
     * Count customers with expired licenses.
     */
    public function countExpiredLicenses(): int
    {
        return $this->query()
            ->where('license_expiry_date', '<', now())
            ->count();
    }

    /**
     * Get customers filtered for export.
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, Customer>
     */
    public function getForExport(array $filters): Collection
    {
        return $this->query()
            ->when(isset($filters['is_blacklisted']), fn ($q) => $q->where('is_blacklisted', $filters['is_blacklisted']))
            ->latest()
            ->get();
    }

    /**
     * Optionally, define allowed filters, sorts, etc.
     */
    public function getAllowedFilters(): array
    {
        return [
            'email',
            'phone',
            'is_blacklisted',
            'license_number',
            'id_type',
            'license_status',
            AllowedFilter::callback('branch_id', fn ($query, $value) => $query->whereHas('branches', fn ($q) => $q->where('branches.id', $value))
            ),
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'created_at',
            'email',
            'license_expiry_date',
            // Add more as needed
        ];
    }

    public function getAllowedIncludes(): array
    {
        return [
            'customerDocuments',
            'branches',
            AllowedInclude::count('rentalsCount'),
        ];
    }

    /**
     * Specify Model class name.
     */
    protected function model(): string
    {
        return Customer::class;
    }
}
