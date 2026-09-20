<?php

namespace App\Http\Controllers\V1;

use App\DTOs\ChauffeurLocationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChauffeurLocationRequest;
use App\Http\Requests\UpdateChauffeurLocationRequest;
use App\Http\Resources\ChauffeurLocationCollection;
use App\Http\Resources\ChauffeurLocationResource;
use App\Models\ChauffeurLocation;
use App\Services\Contracts\ChauffeurLocationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ChauffeurLocationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChauffeurLocationServiceInterface $locationService,
    ) {}

    /**
     * GET /api/v1/public/chauffeur-locations
     */
    public function publicIndex(): JsonResponse
    {
        $locations = ChauffeurLocation::where('is_active', true)->get();

        return $this->successResponse(ChauffeurLocationResource::collection($locations));
    }

    /**
     * GET /api/v1/chauffeur-locations
     */
    public function index(): JsonResponse
    {
        $locations = $this->locationService->getAll();

        return $this->successResponse(new ChauffeurLocationCollection($locations));
    }

    /**
     * POST /api/v1/chauffeur-locations
     */
    public function store(StoreChauffeurLocationRequest $request): JsonResponse
    {
        $location = $this->locationService->create(
            ChauffeurLocationData::fromRequest($request->validated())
        );

        return $this->createdResponse(new ChauffeurLocationResource($location->load('branch')), 'Chauffeur location created successfully.');
    }

    /**
     * GET /api/v1/chauffeur-locations/{chauffeurLocation}
     */
    public function show(ChauffeurLocation $chauffeurLocation): JsonResponse
    {
        return $this->successResponse(new ChauffeurLocationResource($chauffeurLocation->load('branch')));
    }

    /**
     * PUT /api/v1/chauffeur-locations/{chauffeurLocation}
     */
    public function update(UpdateChauffeurLocationRequest $request, ChauffeurLocation $chauffeurLocation): JsonResponse
    {
        $updated = $this->locationService->update($chauffeurLocation->id, $request->validated());

        return $this->successResponse(new ChauffeurLocationResource($updated), 'Chauffeur location updated successfully.');
    }

    /**
     * DELETE /api/v1/chauffeur-locations/{chauffeurLocation}
     */
    public function destroy(ChauffeurLocation $chauffeurLocation): JsonResponse
    {
        $this->locationService->delete($chauffeurLocation->id);

        return $this->noContentResponse();
    }
}
