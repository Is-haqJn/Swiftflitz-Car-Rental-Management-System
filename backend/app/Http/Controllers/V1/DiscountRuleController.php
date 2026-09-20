<?php

namespace App\Http\Controllers\V1;

use App\DTOs\DiscountRuleData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiscountRuleRequest;
use App\Http\Requests\UpdateDiscountRuleRequest;
use App\Http\Resources\DiscountRuleResource;
use App\Models\DiscountRule;
use App\Services\Contracts\DiscountRuleServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DiscountRuleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DiscountRuleServiceInterface $discountRuleService,
    ) {}

    /**
     * GET /api/v1/discount-rules
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', DiscountRule::class);

        $rules = $this->discountRuleService->getAll();

        return $this->successResponse(DiscountRuleResource::collection($rules));
    }

    /**
     * POST /api/v1/discount-rules
     */
    public function store(StoreDiscountRuleRequest $request): JsonResponse
    {
        $this->authorize('create', DiscountRule::class);

        $rule = $this->discountRuleService->create(
            DiscountRuleData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            new DiscountRuleResource($rule->load(['branch', 'conditionVehicle', 'conditionCategory'])),
            'Discount rule created successfully.'
        );
    }

    /**
     * GET /api/v1/discount-rules/{discountRule}
     */
    public function show(DiscountRule $discountRule): JsonResponse
    {
        $this->authorize('view', $discountRule);

        $discountRule->load(['branch', 'conditionVehicle', 'conditionCategory']);

        return $this->successResponse(new DiscountRuleResource($discountRule));
    }

    /**
     * PUT /api/v1/discount-rules/{discountRule}
     */
    public function update(UpdateDiscountRuleRequest $request, DiscountRule $discountRule): JsonResponse
    {
        $this->authorize('update', $discountRule);

        $updated = $this->discountRuleService->update($discountRule->id, $request->validated());

        return $this->successResponse(
            new DiscountRuleResource($updated),
            'Discount rule updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/discount-rules/{discountRule}
     */
    public function destroy(DiscountRule $discountRule): JsonResponse
    {
        $this->authorize('delete', $discountRule);

        $this->discountRuleService->delete($discountRule->id);

        return $this->noContentResponse();
    }
}
