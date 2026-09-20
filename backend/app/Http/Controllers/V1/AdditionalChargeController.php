<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AdditionalChargeData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdditionalChargeRequest;
use App\Http\Requests\UpdateAdditionalChargeRequest;
use App\Http\Resources\AdditionalChargeResource;
use App\Models\AdditionalCharge;
use App\Services\Contracts\AdditionalChargeServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdditionalChargeController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdditionalChargeServiceInterface $chargeService,
    ) {}

    /**
     * GET /api/v1/additional-charges
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', AdditionalCharge::class);

        $charges = $this->chargeService->getAll();

        return $this->successResponse(AdditionalChargeResource::collection($charges));
    }

    /**
     * POST /api/v1/additional-charges
     */
    public function store(StoreAdditionalChargeRequest $request): JsonResponse
    {
        $this->authorize('create', AdditionalCharge::class);

        $charge = $this->chargeService->create(
            AdditionalChargeData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            new AdditionalChargeResource($charge->load(['branch', 'category', 'vehicle'])),
            'Additional charge created successfully.'
        );
    }

    /**
     * GET /api/v1/additional-charges/{additionalCharge}
     */
    public function show(AdditionalCharge $additionalCharge): JsonResponse
    {
        $this->authorize('view', $additionalCharge);

        $additionalCharge->load(['branch', 'category', 'vehicle']);

        return $this->successResponse(new AdditionalChargeResource($additionalCharge));
    }

    /**
     * PUT /api/v1/additional-charges/{additionalCharge}
     */
    public function update(UpdateAdditionalChargeRequest $request, AdditionalCharge $additionalCharge): JsonResponse
    {
        $this->authorize('update', $additionalCharge);

        $updated = $this->chargeService->update($additionalCharge->id, $request->validated());

        return $this->successResponse(
            new AdditionalChargeResource($updated),
            'Additional charge updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/additional-charges/{additionalCharge}
     */
    public function destroy(AdditionalCharge $additionalCharge): JsonResponse
    {
        $this->authorize('delete', $additionalCharge);

        $this->chargeService->delete($additionalCharge->id);

        return $this->noContentResponse();
    }
}
