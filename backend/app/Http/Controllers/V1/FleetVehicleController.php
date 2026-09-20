<?php

namespace App\Http\Controllers\V1;

use App\DTOs\FleetVehicleData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignFleetVehicleServicesRequest;
use App\Http\Requests\StoreFleetVehicleRequest;
use App\Http\Requests\UpdateFleetVehicleRequest;
use App\Http\Requests\UpdateFleetVehicleStatusRequest;
use App\Http\Resources\FleetVehicleResource;
use App\Models\FleetVehicle;
use App\Services\Contracts\FleetVehicleServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class FleetVehicleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected FleetVehicleServiceInterface $fleetVehicleService
    ) {}

    /**
     * GET /api/v1/fleet-vehicles
     */
    public function index(): JsonResponse
    {
        $vehicles = $this->fleetVehicleService->getAll();

        return $this->successResponse(
            data: FleetVehicleResource::collection($vehicles),
            message: 'Fleet vehicles retrieved successfully'
        );
    }

    /**
     * POST /api/v1/fleet-vehicles
     */
    public function store(StoreFleetVehicleRequest $request): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->create(
            FleetVehicleData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Fleet vehicle created successfully'
        );
    }

    /**
     * GET /api/v1/fleet-vehicles/available/airport
     */
    public function availableForAirport(): JsonResponse
    {
        $vehicles = $this->fleetVehicleService->getAvailableForAirport();

        return $this->successResponse(
            data: FleetVehicleResource::collection($vehicles),
            message: 'Available fleet vehicles for airport retrieved successfully'
        );
    }

    /**
     * GET /api/v1/fleet-vehicles/available/chauffeur
     */
    public function availableForChauffeur(): JsonResponse
    {
        $vehicles = $this->fleetVehicleService->getAvailableForChauffeur(
            request()->boolean('featured', false)
        );

        return $this->successResponse(
            data: FleetVehicleResource::collection($vehicles),
            message: 'Available fleet vehicles for chauffeur retrieved successfully'
        );
    }

    /**
     * GET /api/v1/public/chauffeur-vehicles/{vehicle}
     */
    public function showPublic(FleetVehicle $vehicle): JsonResponse
    {
        $vehicle->load(['serviceAssignments.category', 'branch', 'media']);

        return $this->successResponse(new FleetVehicleResource($vehicle));
    }

    /**
     * GET /api/v1/fleet-vehicles/{fleetVehicle}
     */
    public function show(string $id): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->getVehicle($id);

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Fleet vehicle retrieved successfully'
        );
    }

    /**
     * PUT /api/v1/fleet-vehicles/{fleetVehicle}
     */
    public function update(UpdateFleetVehicleRequest $request, string $id): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->update(
            $id,
            FleetVehicleData::fromRequest($request->validated())
        );

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Fleet vehicle updated successfully'
        );
    }

    /**
     * PATCH /api/v1/fleet-vehicles/{fleetVehicle}/services
     */
    public function assignServices(AssignFleetVehicleServicesRequest $request, string $id): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->assignServices($id, $request->validated());

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Service assignments updated successfully'
        );
    }

    /**
     * DELETE /api/v1/fleet-vehicles/{fleetVehicle}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->fleetVehicleService->delete($id);

        return $this->successResponse(
            data: null,
            message: 'Fleet vehicle deleted successfully'
        );
    }

    /**
     * PATCH /api/v1/fleet-vehicles/{fleetVehicle}/status
     */
    public function updateStatus(UpdateFleetVehicleStatusRequest $request, string $id): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->updateStatus($id, $request->validated('status'));

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Fleet vehicle status updated successfully'
        );
    }

    /**
     * PATCH /api/v1/fleet-vehicles/{fleetVehicle}/toggle
     */
    public function toggleActive(string $id): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->toggleActive($id);

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Fleet vehicle status toggled successfully'
        );
    }

    /**
     * POST /api/v1/fleet-vehicles/{fleetVehicle}/photos
     */
    public function uploadPhoto(string $id): JsonResponse
    {
        request()->validate([
            'file' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $vehicle = $this->fleetVehicleService->getVehicle($id);
        $vehicle->addMedia(request()->file('file'))->toMediaCollection('photos');

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle->fresh()),
            message: 'Photo uploaded successfully'
        );
    }

    /**
     * PATCH /api/v1/fleet-vehicles/{fleetVehicle}/photos/{mediaId}/primary
     */
    public function setPrimaryPhoto(string $id, string $mediaId): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->setPrimaryPhoto($id, $mediaId);

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle),
            message: 'Primary photo updated successfully'
        );
    }

    /**
     * DELETE /api/v1/fleet-vehicles/{fleetVehicle}/photos/{mediaId}
     */
    public function deletePhoto(string $id, string $mediaId): JsonResponse
    {
        $vehicle = $this->fleetVehicleService->getVehicle($id);
        $media = $vehicle->getMedia('photos')->firstWhere('id', $mediaId);

        if ($media) {
            $media->delete();
        }

        return $this->successResponse(
            data: new FleetVehicleResource($vehicle->fresh()),
            message: 'Photo deleted successfully'
        );
    }
}
