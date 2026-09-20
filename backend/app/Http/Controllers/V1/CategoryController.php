<?php

namespace App\Http\Controllers\V1;

use App\DTOs\CategoryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\Vehicle\CategoryResource;
use App\Services\Contracts\CategoryServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function __construct(protected CategoryServiceInterface $categoryService) {}

    // GET /api/v1/categories
    public function index(Request $request): JsonResponse
    {
        $categories = $this->categoryService->getCategories($request);

        return $this->successResponse(
            data: CategoryResource::collection($categories),
            message: 'Categories retrieved successfully.',
        );
    }

    // GET /api/v1/categories/{category}
    public function show(string $id): JsonResponse
    {
        $category = $this->categoryService->getCategory($id);

        return $this->successResponse(
            data: new CategoryResource($category),
            message: 'Category retrieved successfully.',
        );
    }

    // POST /api/v1/categories
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $dto = CategoryData::fromRequest($request->validated());
        $category = $this->categoryService->createCategory($dto);

        return $this->successResponse(
            data: new CategoryResource($category),
            message: 'Category created successfully.',
            // code: 201,
        );
    }

    // PUT /api/v1/categories/{category}
    public function update(UpdateCategoryRequest $request, string $id): JsonResponse
    {
        $category = $this->categoryService->updateCategory($id, $request->validated());

        return $this->successResponse(
            data: new CategoryResource($category->fresh()),
            message: 'Category updated successfully.',
        );
    }

    // DELETE /api/v1/categories/{category}
    public function destroy(string $id): JsonResponse
    {
        $this->categoryService->deleteCategory($id);

        return $this->successResponse(
            data: null,
            message: 'Category deleted successfully.',
        );
    }

    // POST /api/v1/categories/{category}/image
    public function uploadImage(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $category = $this->categoryService->uploadImage($id, $request->file('image'));

        return $this->successResponse(
            data: new CategoryResource($category->fresh()),
            message: 'Image uploaded successfully.',
        );
    }

    // DELETE /api/v1/categories/{category}/image
    public function deleteImage(string $id): JsonResponse
    {
        $this->categoryService->deleteImage($id);

        return $this->successResponse(
            data: null,
            message: 'Image removed successfully.',
        );
    }
}
