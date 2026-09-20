<?php

namespace App\Repositories;

use App\Enums\RentalStatus;
use App\Models\Rental;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\RentalRepositoryInterface;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RentalRepository extends QueryableRepository implements RentalRepositoryInterface
{
    public function query(): QueryBuilder
    {
        $base = parent::query()->defaultSort('-created_at');

        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $base->whereIn('branch_id', empty($branchIds) ? ['__none__'] : $branchIds);
        }

        return $base;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('status'),
            AllowedFilter::exact('payment_status'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('vehicle_id'),
            AllowedFilter::exact('customer_id'),
            AllowedFilter::exact('source'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('reference', 'like', "%{$value}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$value}%"))
                        ->orWhereHas('vehicle', fn ($vq) => $vq->where('name', 'like', "%{$value}%")
                            ->orWhere('license_plate', 'like', "%{$value}%"));
                });
            }),
            AllowedFilter::callback('pickup_date_from', function ($query, $value) {
                $query->where('pickup_date', '>=', $value);
            }),
            AllowedFilter::callback('pickup_date_to', function ($query, $value) {
                $query->where('pickup_date', '<=', $value);
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'pickup_date', 'return_date', 'total_cost', 'status', 'reference'];
    }

    public function getAllowedIncludes(): array
    {
        return [
            'vehicle',
            'customer',
            'branch',
            'manager',
            'confirmedBy',
            'pickupLocation',
            'dropoffLocation',
            'inspections',
        ];
    }

    public function getDefaultIncludes(): array
    {
        return ['vehicle', 'customer', 'branch'];
    }

    public function getAll(): mixed
    {
        return $this->paginateFiltered();
    }

    public function findRental(string $id): Rental
    {
        return Rental::with([
            'vehicle.category',
            'customer',
            'branch',
            'manager',
            'confirmedBy',
            'pickupLocation',
            'dropoffLocation',
            'inspections.inspector',
        ])->findOrFail($id);
    }

    public function createRental(array $data): Rental
    {
        return Rental::create($data);
    }

    public function updateRental(string $id, array $data): Rental
    {
        $rental = $this->findRental($id);
        $rental->update($data);

        return $rental->fresh([
            'vehicle.category',
            'customer',
            'branch',
            'manager',
            'confirmedBy',
            'pickupLocation',
            'dropoffLocation',
            'inspections.inspector',
        ]);
    }

    public function deleteRental(string $id): void
    {
        $this->findRental($id)->delete();
    }

    public function generateReference(): string
    {
        $year = now()->year;
        do {
            $ref = 'RF-' . $year . '-' . strtoupper(Str::random(5));
        } while (Rental::where('reference', $ref)->exists());

        return $ref;
    }

    public function countByStatuses(array $statuses, array $branchIds = []): int
    {
        $query = Rental::query()->whereIn('status', $statuses);
        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query->count();
    }

    public function pendingPaymentsTotal(array $branchIds = []): float
    {
        $query = Rental::query()
            ->whereIn('status', [
                RentalStatus::Active->value,
                RentalStatus::Confirmed->value,
                RentalStatus::Overdue->value,
            ])
            ->where(function ($q) {
                $q->whereColumn('amount_paid', '<', 'total_cost')
                    ->orWhere(function ($sub) {
                        $sub->whereNotNull('damage_balance_due')
                            ->where('damage_balance_due', '>', 0);
                    });
            });

        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        $raw = $query->selectRaw(
            'SUM(CASE WHEN (total_cost - amount_paid) > 0 THEN (total_cost - amount_paid) ELSE 0 END + COALESCE(damage_balance_due, 0)) as total_pending'
        )->value('total_pending');

        return round((float) ($raw ?? 0), 2);
    }

    protected function model(): string
    {
        return Rental::class;
    }
}
