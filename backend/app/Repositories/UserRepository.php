<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class UserRepository extends QueryableRepository implements UserRepositoryInterface
{
    /**
     * Get all users (non-paginated).
     */
    public function getUsers(): Collection
    {
        return $this->getFiltered();
    }

    /**
     * Get paginated, filtered users with an optional super_admin role scope and branch scope.
     * When $includeSuperAdmins is false, users with the 'super_admin' role are excluded.
     * When $branchIds is non-empty, only users belonging to at least one of those branches are returned.
     *
     * @param  array<int|string>  $branchIds
     */
    public function paginateFilteredWithRoleScope(int $perPage, bool $includeSuperAdmins, array $branchIds = []): LengthAwarePaginator
    {
        $query = $this->query();

        if (! $includeSuperAdmins) {
            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'super_admin'));
        }

        if (! empty($branchIds)) {
            $query->whereHas('branches', fn ($q) => $q->whereIn('branches.id', $branchIds));
        }

        $perPage = request()->input('per_page', $perPage) ?? $perPage;

        return $query->paginate($perPage)->withPath($this->paginatedPath);
    }

    /**
     * Get allowed filters for user queries.
     */
    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('id'),
            AllowedFilter::partial('name'),
            AllowedFilter::partial('email'),
            AllowedFilter::partial('username'),
            AllowedFilter::exact('is_active'),
        ];
    }

    /**
     * Get allowed sorts for user queries.
     */
    public function getAllowedSorts(): array
    {
        return ['name', 'email', 'username', 'created_at', 'last_login_at'];
    }

    /**
     * Get allowed includes for user queries.
     */
    public function getAllowedIncludes(): array
    {
        return ['roles', 'permissions'];
    }

    /**
     * Get default includes always loaded with queries.
     */
    public function getDefaultIncludes(): array
    {
        return ['roles'];
    }

    protected function model(): string
    {
        return User::class;
    }
}
