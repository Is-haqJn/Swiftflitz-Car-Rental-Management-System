<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RentalDiscountUsageResource;
use App\Models\DiscountRule;
use App\Services\Contracts\DiscountUsageServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountUsageController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DiscountUsageServiceInterface $discountUsageService
    ) {}

    /**
     * GET /api/v1/discount-usages
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DiscountRule::class);

        $usages = $this->discountUsageService->listUsages($request->integer('per_page', 15));

        return $this->successResponse(RentalDiscountUsageResource::collection($usages));
    }
}
