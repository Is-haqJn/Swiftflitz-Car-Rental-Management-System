<?php

namespace App\Services\Contracts;

use App\DTOs\CategoryData;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface CategoryServiceInterface
{
    public function getCategories(?Request $request = null): LengthAwarePaginator;

    public function getCategory(string $id): Category;

    public function createCategory(CategoryData $data): Category;

    public function updateCategory(string $id, array $data): Category;

    public function deleteCategory(string $id): bool;

    public function uploadImage(string $id, $file): Category;

    public function deleteImage(string $id): bool;
}
