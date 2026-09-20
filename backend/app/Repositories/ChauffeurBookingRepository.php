<?php

namespace App\Repositories;

use App\Models\ChauffeurBooking;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\ChauffeurBookingRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ChauffeurBookingRepository extends QueryableRepository implements ChauffeurBookingRepositoryInterface
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

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->paginateFiltered($perPage);
    }

    public function findBooking(string $id): ChauffeurBooking
    {
        return ChauffeurBooking::with([
            'branch',
            'vehicle',
            'driver',
            'chauffeurCustomer',
            'pickupLocation',
            'createdBy',
            'cancelledBy',
            'bookingRecords.performedBy',
            'pickupLog',
            'returnLog',
        ])->findOrFail($id);
    }

    public function generateReference(): string
    {
        $year = now()->year;
        $prefix = 'CHF-' . $year . '-';

        $lastBooking = ChauffeurBooking::where('booking_reference', 'like', $prefix . '%')
            ->orderByDesc('booking_reference')
            ->first();

        $sequence = 1;
        if ($lastBooking) {
            $parts = explode('-', $lastBooking->booking_reference);
            $sequence = ((int) end($parts)) + 1;
        }

        return $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }

    public function createBooking(array $data): ChauffeurBooking
    {
        return ChauffeurBooking::create($data);
    }

    public function updateBooking(string $id, array $data): ChauffeurBooking
    {
        $booking = ChauffeurBooking::findOrFail($id);
        $booking->update($data);

        return $booking->fresh([
            'branch',
            'vehicle',
            'driver',
            'chauffeurCustomer',
            'pickupLocation',
            'createdBy',
            'cancelledBy',
            'bookingRecords.performedBy',
            'pickupLog',
            'returnLog',
        ]);
    }

    public function deleteBooking(string $id): bool
    {
        return (bool) ChauffeurBooking::findOrFail($id)->delete();
    }

    public function countByStatuses(array $statuses, array $branchIds = []): int
    {
        $query = ChauffeurBooking::query()->whereIn('booking_status', $statuses);
        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query->count();
    }

    public function countInPeriod(CarbonInterface $from, CarbonInterface $to, string $excludeStatus, array $branchIds = []): int
    {
        $query = ChauffeurBooking::query()
            ->whereBetween('created_at', [$from, $to])
            ->where('booking_status', '!=', $excludeStatus);

        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query->count();
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('booking_status'),
            AllowedFilter::exact('payment_status'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::callback('pickup_from', fn ($query, $value) => $query->where('pickup_time', '>=', $value)),
            AllowedFilter::callback('pickup_to', fn ($query, $value) => $query->where('pickup_time', '<=', $value)),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('booking_reference', 'like', "%{$value}%")
                        ->orWhereHas('chauffeurCustomer', fn ($cq) => $cq->where('full_name', 'like', "%{$value}%")
                            ->orWhere('phone', 'like', "%{$value}%"));
                });
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'pickup_time', 'return_time', 'total_amount', 'booking_reference'];
    }

    public function getDefaultIncludes(): array
    {
        return ['branch', 'chauffeurCustomer', 'pickupLocation', 'vehicle', 'driver'];
    }

    public function getAllowedIncludes(): array
    {
        return ['branch', 'chauffeurCustomer', 'pickupLocation', 'vehicle', 'driver', 'createdBy', 'cancelledBy', 'bookingRecords', 'pickupLog', 'returnLog'];
    }

    protected function model(): string
    {
        return ChauffeurBooking::class;
    }
}
