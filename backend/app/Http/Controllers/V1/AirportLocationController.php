<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportLocationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAirportLocationRequest;
use App\Http\Requests\UpdateAirportLocationRequest;
use App\Http\Resources\AirportLocationResource;
use App\Models\AirportLocation;
use App\Services\Contracts\AirportLocationServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AirportLocationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportLocationServiceInterface $locationService,
    ) {}

    /**
     * GET /api/v1/airport-locations
     */
    public function index(): JsonResponse
    {
        $locations = $this->locationService->getAll();

        return $this->successResponse(AirportLocationResource::collection($locations));
    }

    /**
     * GET /api/v1/airport-locations/terminals?airport_id=
     */
    public function terminals(Request $request): JsonResponse
    {
        $airportId = $request->query('airport_id');

        abort_if(! $airportId, 422, 'airport_id query parameter is required.');

        $locations = $this->locationService->getTerminalsByAirport($airportId);

        return $this->successResponse(AirportLocationResource::collection($locations));
    }

    /**
     * GET /api/v1/airport-locations/areas?branch_id=
     */
    public function areas(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');

        abort_if(! $branchId, 422, 'branch_id query parameter is required.');

        $locations = $this->locationService->getAreasByBranch($branchId);

        return $this->successResponse(AirportLocationResource::collection($locations));
    }

    /**
     * POST /api/v1/airport-locations
     */
    public function store(StoreAirportLocationRequest $request): JsonResponse
    {
        $location = $this->locationService->create(AirportLocationData::fromRequest($request->validated()));

        return $this->createdResponse(new AirportLocationResource($location), 'Airport location created successfully.');
    }

    /**
     * GET /api/v1/airport-locations/{airportLocation}
     */
    public function show(AirportLocation $airportLocation): JsonResponse
    {
        return $this->successResponse(new AirportLocationResource($airportLocation));
    }

    /**
     * PUT /api/v1/airport-locations/{airportLocation}
     */
    public function update(UpdateAirportLocationRequest $request, AirportLocation $airportLocation): JsonResponse
    {
        $updated = $this->locationService->update($airportLocation->id, $request->validated());

        return $this->successResponse(new AirportLocationResource($updated), 'Airport location updated successfully.');
    }

    /**
     * DELETE /api/v1/airport-locations/{airportLocation}
     */
    public function destroy(AirportLocation $airportLocation): JsonResponse
    {
        $this->locationService->delete($airportLocation->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/airport-locations/{airportLocation}/toggle-active
     */
    public function toggleActive(AirportLocation $airportLocation): JsonResponse
    {
        $updated = $this->locationService->toggleActive($airportLocation->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new AirportLocationResource($updated), "Airport location {$status} successfully.");
    }
}
