<?php

namespace App\Repositories\Base\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface BaseRepositoryInterface
{
    /**
     * Get all resources
     */
    public function all(array $columns = ['*']): Collection;

    /**
     * Get paginated resources
     */
    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator;

    /**
     * Find resource by id
     */
    public function find(int|string $id, array $columns = ['*']): ?Model;

    /**
     * Find resource by field
     */
    public function findByField(string $field, mixed $value, array $columns = ['*']): ?Model;

    /**
     * Find resource or fail
     */
    public function findOrFail(int|string $id, array $columns = ['*']): Model;

    /**
     * Create new resource
     */
    public function create(array $data): Model;

    /**
     * Update resource
     */
    public function update(int|string $id, array $data): Model;

    /**
     * Delete resource
     */
    public function delete(int|string $id): bool;

    /**
     * Get model instance
     */
    public function getModel(): Model;
}
