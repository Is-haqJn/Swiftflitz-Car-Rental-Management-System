<?php

namespace App\Repositories;

use App\Models\Driver;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\DriverRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class DriverRepository extends QueryableRepository implements DriverRepositoryInterface
{
    public function getAllowedFilters(): array
    {
        return [
            'status',
            'available_for_chauffeur',
            'available_for_airport',
            'is_active',
            AllowedFilter::callback('license_status', function ($query, $value) {
                if ($value === 'expired') {
                    $query->where('license_expiry_date', '<', now());
                } elseif ($value === 'expiring_soon') {
                    $query->whereBetween('license_expiry_date', [now(), now()->addDays(30)]);
                }
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'created_at',
            'first_name',
            'last_name',
            'license_expiry_date',
        ];
    }

    public function getAvailableForChauffeur(): Collection
    {
        return Driver::available()->forChauffeur()->get();
    }

    public function getAvailableForAirport(): Collection
    {
        return Driver::available()->forAirport()->get();
    }

    public function findByLicenseNumber(string $licenseNumber): ?Driver
    {
        return $this->model->where('license_number', $licenseNumber)->first();
    }

    public function findByPhone(string $phone): ?Driver
    {
        return $this->model->where('phone_number', $phone)->first();
    }

    protected function model(): string
    {
        return Driver::class;
    }
}
