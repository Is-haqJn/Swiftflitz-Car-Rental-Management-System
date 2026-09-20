<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAirportRequest;
use App\Http\Requests\UpdateAirportRequest;
use App\Http\Resources\AirportResource;
use App\Models\Airport;
use App\Services\Contracts\AirportServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AirportController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportServiceInterface $airportService,
    ) {}

    /**
     * GET /api/v1/airports
     */
    public function index(): JsonResponse
    {
        $airports = $this->airportService->getAll();

        return $this->successResponse(AirportResource::collection($airports));
    }

    /**
     * GET /api/v1/airports/active
     */
    public function active(): JsonResponse
    {
        $airports = $this->airportService->getActive();

        return $this->successResponse(AirportResource::collection($airports));
    }

    /**
     * POST /api/v1/airports
     */
    public function store(StoreAirportRequest $request): JsonResponse
    {
        $airport = $this->airportService->create(AirportData::fromRequest($request->validated()));

        return $this->createdResponse(new AirportResource($airport), 'Airport created successfully.');
    }

    /**
     * GET /api/v1/airports/{airport}
     */
    public function show(Airport $airport): JsonResponse
    {
        return $this->successResponse(new AirportResource($airport));
    }

    /**
     * PUT /api/v1/airports/{airport}
     */
    public function update(UpdateAirportRequest $request, Airport $airport): JsonResponse
    {
        $updated = $this->airportService->update($airport->id, $request->validated());

        return $this->successResponse(new AirportResource($updated), 'Airport updated successfully.');
    }

    /**
     * DELETE /api/v1/airports/{airport}
     */
    public function destroy(Airport $airport): JsonResponse
    {
        $this->airportService->delete($airport->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/airports/{airport}/toggle-active
     */
    public function toggleActive(Airport $airport): JsonResponse
    {
        $updated = $this->airportService->toggleActive($airport->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new AirportResource($updated), "Airport {$status} successfully.");
    }

    /**
     * PATCH /api/v1/airports/{airport}/set-as-default
     */
    public function setAsDefault(Airport $airport): JsonResponse
    {
        $updated = $this->airportService->setAsDefault($airport->id);

        return $this->successResponse(new AirportResource($updated), 'Airport set as default successfully.');
    }
}
