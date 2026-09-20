<?php

namespace App\Repositories;

use App\Models\AirportBooking;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportBookingRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AirportBookingRepository extends QueryableRepository implements AirportBookingRepositoryInterface
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

    public function findBooking(string $id): AirportBooking
    {
        return AirportBooking::with([
            'branch',
            'airport',
            'package',
            'packageAssignment',
            'airportCustomer',
            'terminalLocation',
            'areaLocation',
            'vehicle',
            'driver',
            'createdBy',
            'cancelledBy',
            'bookingRecords.performedBy',
        ])->findOrFail($id);
    }

    public function generateReference(): string
    {
        $year = now()->year;
        do {
            $ref = 'APT-' . $year . '-' . strtoupper(Str::random(5));
        } while (AirportBooking::where('booking_reference', $ref)->exists());

        return $ref;
    }

    public function createBooking(array $data): AirportBooking
    {
        return AirportBooking::create($data);
    }

    public function updateBooking(string $id, array $data): AirportBooking
    {
        $booking = $this->findBooking($id);
        $booking->update($data);

        return $booking->fresh([
            'branch',
            'airport',
            'package',
            'packageAssignment',
            'airportCustomer',
            'terminalLocation',
            'areaLocation',
            'vehicle',
            'driver',
            'createdBy',
            'cancelledBy',
            'bookingRecords.performedBy',
        ]);
    }

    public function deleteBooking(string $id): bool
    {
        return (bool) AirportBooking::findOrFail($id)->delete();
    }

    public function countByStatuses(array $statuses, array $branchIds = []): int
    {
        $query = AirportBooking::query()->whereIn('booking_status', $statuses);
        if (! empty($branchIds)) {
            $query->whereIn('branch_id', $branchIds);
        }

        return $query->count();
    }

    public function countInPeriod(CarbonInterface $from, CarbonInterface $to, string $excludeStatus, array $branchIds = []): int
    {
        $query = AirportBooking::query()
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
            AllowedFilter::exact('direction'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('airport_id'),
            AllowedFilter::callback('scheduled_at_from', fn ($query, $value) => $query->where('scheduled_at', '>=', $value)),
            AllowedFilter::callback('scheduled_at_to', fn ($query, $value) => $query->where('scheduled_at', '<=', $value)),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('booking_reference', 'like', "%{$value}%")
                        ->orWhere('passenger_name', 'like', "%{$value}%");
                });
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'scheduled_at', 'total_amount', 'booking_reference'];
    }

    public function getDefaultIncludes(): array
    {
        return ['branch', 'airport', 'airportCustomer', 'package', 'terminalLocation', 'areaLocation'];
    }

    public function getAllowedIncludes(): array
    {
        return ['branch', 'airport', 'airportCustomer', 'package', 'packageAssignment', 'terminalLocation', 'areaLocation', 'vehicle', 'driver', 'createdBy', 'cancelledBy'];
    }

    protected function model(): string
    {
        return AirportBooking::class;
    }
}
