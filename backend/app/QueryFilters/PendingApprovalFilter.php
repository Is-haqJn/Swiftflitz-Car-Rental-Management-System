<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

/**
 * Custom Spatie QB filter: filter[pending_approval]=1
 *
 * Matches rentals that have been returned but not yet approved:
 *   status IN ('active', 'overdue') AND actual_return_date IS NOT NULL
 */
class PendingApprovalFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): void
    {
        if ($value) {
            $query->where('status', 'returned');
        }
    }
}
