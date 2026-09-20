<?php

namespace App\Http\Controllers\V1;

use App\DTOs\FeatureData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeatureRequest;
use App\Http\Requests\UpdateFeatureRequest;
use App\Http\Resources\Vehicle\FeatureResource;
use App\Services\Contracts\FeatureServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureController extends Controller
{
    use ApiResponse;

    public function __construct(protected FeatureServiceInterface $featureService) {}

    // GET /api/v1/features
    public function index(Request $request): JsonResponse
    {
        $features = $this->featureService->getFeatures($request);

        return $this->successResponse(
            data: FeatureResource::collection($features),
            message: 'Features retrieved successfully.',
        );
    }

    // GET /api/v1/features/active  ← for vehicle form dropdown
    public function active(): JsonResponse
    {
        $features = $this->featureService->getActiveFeatures();

        return $this->successResponse(
            data: FeatureResource::collection($features),
            message: 'Active features retrieved successfully.',
        );
    }

    // GET /api/v1/features/{feature}
    public function show(string $id): JsonResponse
    {
        $feature = $this->featureService->getFeature($id);

        return $this->successResponse(
            data: new FeatureResource($feature),
            message: 'Feature retrieved successfully.',
        );
    }

    // POST /api/v1/features
    public function store(StoreFeatureRequest $request): JsonResponse
    {
        $dto = FeatureData::fromRequest($request->validated());
        $feature = $this->featureService->createFeature($dto);

        return $this->successResponse(
            data: new FeatureResource($feature),
            message: 'Feature created successfully.',
            // code: 201,
        );
    }

    // PUT /api/v1/features/{feature}
    public function update(UpdateFeatureRequest $request, string $id): JsonResponse
    {
        $feature = $this->featureService->updateFeature($id, $request->validated());

        return $this->successResponse(
            data: new FeatureResource($feature->fresh()),
            message: 'Feature updated successfully.',
        );
    }

    // DELETE /api/v1/features/{feature}
    public function destroy(string $id): JsonResponse
    {
        $this->featureService->deleteFeature($id);

        return $this->successResponse(
            data: null,
            message: 'Feature deleted successfully.',
        );
    }
}
