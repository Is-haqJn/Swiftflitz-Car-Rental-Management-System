<?php

namespace App\Repositories\Contracts;

use App\Models\Driver;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DriverRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get available drivers assigned to chauffeur service.
     *
     * @return Collection<int, Driver>
     */
    public function getAvailableForChauffeur(): Collection;

    /**
     * Get available drivers assigned to airport service.
     *
     * @return Collection<int, Driver>
     */
    public function getAvailableForAirport(): Collection;

    /**
     * Find a driver by license number.
     */
    public function findByLicenseNumber(string $licenseNumber): ?Driver;

    /**
     * Find a driver by phone number.
     */
    public function findByPhone(string $phone): ?Driver;
}
