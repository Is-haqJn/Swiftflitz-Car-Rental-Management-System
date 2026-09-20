<?php

namespace App\Repositories\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface extends QueryableRepositoryInterface
{
    public function getUsers(): Collection;

    /**
     * Get paginated, filtered users with an optional super_admin role scope and branch scope.
     * When $includeSuperAdmins is false, users with the 'super_admin' role are excluded.
     * When $branchIds is non-empty, only users belonging to at least one of those branches are returned.
     *
     * @param  array<int|string>  $branchIds
     */
    public function paginateFilteredWithRoleScope(int $perPage, bool $includeSuperAdmins, array $branchIds = []): LengthAwarePaginator;
}
