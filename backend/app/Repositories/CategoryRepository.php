<?php

namespace App\Repositories;

use App\Models\Category;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class CategoryRepository extends QueryableRepository implements CategoryRepositoryInterface
{
    public function getCategories(int $perPage = 15): LengthAwarePaginator
    {
        return $this->query()
            ->withCount($this->getAllowedIncludes())
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getAllowedFilters(): array
    {
        return [
            'name',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'name',
            'created_at',
        ];
    }

    public function getAllowedIncludes(): array
    {
        return ['vehicles'];
    }

    public function getDefaultIncludes(): array
    {
        return [
            'vehicles',
        ];
    }

    protected function model(): string
    {
        return Category::class;
    }
}
