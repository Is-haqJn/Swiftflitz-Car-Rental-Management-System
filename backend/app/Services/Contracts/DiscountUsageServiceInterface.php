<?php

namespace App\Services\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DiscountUsageServiceInterface
{
    /**
     * Get paginated, filtered discount usage records.
     */
    public function listUsages(int $perPage = 15): LengthAwarePaginator;
}
