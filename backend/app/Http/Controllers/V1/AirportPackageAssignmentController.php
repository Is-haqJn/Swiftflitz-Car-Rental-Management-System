<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportPackageAssignmentData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAirportPackageAssignmentRequest;
use App\Http\Requests\UpdateAirportPackageAssignmentRequest;
use App\Http\Resources\AirportPackageAssignmentResource;
use App\Models\Airport;
use App\Models\AirportPackageAssignment;
use App\Services\Contracts\AirportPackageAssignmentServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AirportPackageAssignmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportPackageAssignmentServiceInterface $assignmentService,
    ) {}

    /**
     * GET /api/v1/airport-package-assignments
     */
    public function index(): JsonResponse
    {
        $assignments = $this->assignmentService->getAll();

        return $this->successResponse(AirportPackageAssignmentResource::collection($assignments));
    }

    /**
     * GET /api/v1/airport-package-assignments/by-airport/{airport}
     */
    public function byAirport(Airport $airport): JsonResponse
    {
        $assignments = $this->assignmentService->getByAirport($airport->id);

        return $this->successResponse(AirportPackageAssignmentResource::collection($assignments));
    }

    /**
     * POST /api/v1/airport-package-assignments
     */
    public function store(StoreAirportPackageAssignmentRequest $request): JsonResponse
    {
        $assignment = $this->assignmentService->create(AirportPackageAssignmentData::fromRequest($request->validated()));

        return $this->createdResponse(new AirportPackageAssignmentResource($assignment), 'Package assignment created successfully.');
    }

    /**
     * GET /api/v1/airport-package-assignments/{airportPackageAssignment}
     */
    public function show(AirportPackageAssignment $airportPackageAssignment): JsonResponse
    {
        $airportPackageAssignment->load(['package', 'airport']);

        return $this->successResponse(new AirportPackageAssignmentResource($airportPackageAssignment));
    }

    /**
     * PUT /api/v1/airport-package-assignments/{airportPackageAssignment}
     */
    public function update(UpdateAirportPackageAssignmentRequest $request, AirportPackageAssignment $airportPackageAssignment): JsonResponse
    {
        $updated = $this->assignmentService->update($airportPackageAssignment->id, $request->validated());

        return $this->successResponse(new AirportPackageAssignmentResource($updated), 'Package assignment updated successfully.');
    }

    /**
     * DELETE /api/v1/airport-package-assignments/{airportPackageAssignment}
     */
    public function destroy(AirportPackageAssignment $airportPackageAssignment): JsonResponse
    {
        $this->assignmentService->delete($airportPackageAssignment->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/airport-package-assignments/{airportPackageAssignment}/toggle-active
     */
    public function toggleActive(AirportPackageAssignment $airportPackageAssignment): JsonResponse
    {
        $updated = $this->assignmentService->toggleActive($airportPackageAssignment->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new AirportPackageAssignmentResource($updated), "Package assignment {$status} successfully.");
    }
}
