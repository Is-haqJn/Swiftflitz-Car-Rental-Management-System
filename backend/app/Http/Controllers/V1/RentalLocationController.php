<?php

namespace App\Http\Controllers\V1;

use App\DTOs\RentalLocationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRentalLocationRequest;
use App\Http\Requests\UpdateRentalLocationRequest;
use App\Http\Resources\RentalLocationResource;
use App\Models\RentalLocation;
use App\Services\Contracts\RentalLocationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RentalLocationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RentalLocationServiceInterface $locationService,
    ) {}

    /**
     * GET /api/v1/rental-locations
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', RentalLocation::class);

        $locations = $this->locationService->getAll();

        return $this->successResponse(RentalLocationResource::collection($locations));
    }

    /**
     * POST /api/v1/rental-locations
     */
    public function store(StoreRentalLocationRequest $request): JsonResponse
    {
        $this->authorize('create', RentalLocation::class);

        $location = $this->locationService->create(
            RentalLocationData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            new RentalLocationResource($location),
            'Location created successfully.'
        );
    }

    /**
     * GET /api/v1/rental-locations/{rentalLocation}
     */
    public function show(RentalLocation $rentalLocation): JsonResponse
    {
        $this->authorize('view', $rentalLocation);

        $rentalLocation->load('branch');

        return $this->successResponse(new RentalLocationResource($rentalLocation));
    }

    /**
     * PUT /api/v1/rental-locations/{rentalLocation}
     */
    public function update(UpdateRentalLocationRequest $request, RentalLocation $rentalLocation): JsonResponse
    {
        $this->authorize('update', $rentalLocation);

        $updated = $this->locationService->update($rentalLocation->id, $request->validated());

        return $this->successResponse(
            new RentalLocationResource($updated),
            'Location updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/rental-locations/{rentalLocation}
     */
    public function destroy(RentalLocation $rentalLocation): JsonResponse
    {
        $this->authorize('delete', $rentalLocation);

        $this->locationService->delete($rentalLocation->id);

        return $this->noContentResponse();
    }
}
