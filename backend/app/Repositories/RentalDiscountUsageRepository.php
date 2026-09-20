<?php

namespace App\Repositories;

use App\Models\RentalDiscountUsage;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\RentalDiscountUsageRepositoryInterface;
use Spatie\QueryBuilder\AllowedFilter;

class RentalDiscountUsageRepository extends QueryableRepository implements RentalDiscountUsageRepositoryInterface
{
    public function model(): string
    {
        return RentalDiscountUsage::class;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('discount_type'),
            AllowedFilter::exact('discount_rule_id'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'amount'];
    }

    public function getDefaultIncludes(): array
    {
        return ['discountRule', 'appliedBy', 'rental'];
    }
}
