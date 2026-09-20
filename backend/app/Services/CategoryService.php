<?php

namespace App\Services;

use App\DTOs\CategoryData;
use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Services\Contracts\CategoryServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class CategoryService implements CategoryServiceInterface
{
    public function __construct(
        protected CategoryRepositoryInterface $categoryRepository
    ) {}

    public function getCategories(?Request $request = null): LengthAwarePaginator
    {
        // Repository uses spatie query-builder internally; delegate to it.
        return $this->categoryRepository->getCategories();
    }

    public function getCategory(string $id): Category
    {
        return $this->categoryRepository->findOrFail($id);
    }

    public function createCategory(CategoryData $data): Category
    {
        return $this->categoryRepository->create($data->toArray());
    }

    public function updateCategory(string $id, array $data): Category
    {
        return $this->categoryRepository->update($id, $data);
    }

    public function deleteCategory(string $id): bool
    {
        $category = $this->categoryRepository->find($id);

        if ($category->vehicles()->exists()) {
            abort(422, 'This category cannot be deleted because it has vehicles assigned to it. Reassign or remove the vehicles first.');
        }

        return $this->categoryRepository->delete($id);
    }

    public function uploadImage(string $id, $file): Category
    {
        $category = $this->getCategory($id);
        $category->addMedia($file)->toMediaCollection('image');

        return $category->fresh();
    }

    public function deleteImage(string $id): bool
    {
        $category = $this->getCategory($id);
        $category->clearMediaCollection('image');

        return true;
    }
}
