<?php

namespace App\Http\Controllers\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/categories
     * List active vehicle categories with name and image for the public website.
     */
    public function index(): JsonResponse
    {
        $categories = Category::where('is_active', true)
            ->with('media')
            ->orderBy('name')
            ->get();

        $data = $categories->map(fn (Category $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'image' => ($media = $c->getFirstMedia('image'))
                ? ($media->hasGeneratedConversion('medium') ? $media->getUrl('medium') : ($media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : $media->getUrl()))
                : null,
        ]);

        return $this->successResponse($data, 'Categories retrieved successfully');
    }
}
