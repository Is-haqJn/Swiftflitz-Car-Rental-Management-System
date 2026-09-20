<?php

namespace App\Repositories\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;

interface CategoryRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get filtered categories.
     */
    public function getCategories();

    /**
     * Optionally other category specific methods
     */
}
