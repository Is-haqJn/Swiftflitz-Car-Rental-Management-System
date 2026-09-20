<?php

namespace App\Services;

use App\Repositories\Contracts\RentalDiscountUsageRepositoryInterface;
use App\Services\Contracts\DiscountUsageServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DiscountUsageService implements DiscountUsageServiceInterface
{
    public function __construct(
        protected RentalDiscountUsageRepositoryInterface $repository
    ) {}

    public function listUsages(int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginateFiltered($perPage);
    }
}
