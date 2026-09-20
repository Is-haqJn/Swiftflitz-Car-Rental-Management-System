<?php

namespace App\Http\Controllers\V1;

use App\DTOs\VehicleData;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\Vehicle\VehicleResource;
use App\Models\Rental;
use App\Models\Vehicle;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\VehicleServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected VehicleServiceInterface $vehicleService,
        protected VehicleRepositoryInterface $vehicleRepository
    ) {}

    /**
     * GET /api/v1/vehicles
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Vehicle::class);

        $vehicles = $this->vehicleService->getFilteredVehicles(request());

        return $this->successResponse(
            data: VehicleResource::collection($vehicles),
            message: 'Vehicles retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/vehicles
     */
    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $this->authorize('create', Vehicle::class);

        $vehicle = $this->vehicleService->createVehicle(
            VehicleData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            data: new VehicleResource($vehicle),
            message: 'Vehicle created successfully.'
        );
    }

    /**
     * GET /api/v1/vehicles/{vehicle}
     */
    public function show(string $vehicle): JsonResponse
    {
        $found = $this->vehicleService->getVehicle($vehicle);

        return $this->successResponse(
            data: new VehicleResource($found),
            message: 'Vehicle retrieved successfully.'
        );
    }

    /**
     * PUT /api/v1/vehicles/{vehicle}
     */
    public function update(UpdateVehicleRequest $request, string $vehicle): JsonResponse
    {
        $vehicleModel = Vehicle::findOrFail($vehicle);
        $this->authorize('update', $vehicleModel);

        $updated = $this->vehicleService->updateVehicle(
            $vehicle,
            $request->validated()
        );

        return $this->successResponse(
            data: new VehicleResource($updated),
            message: 'Vehicle updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/vehicles/{vehicle}
     */
    public function destroy(string $vehicle): JsonResponse
    {
        $vehicleModel = Vehicle::findOrFail($vehicle);
        $this->authorize('delete', $vehicleModel);

        $this->vehicleService->deleteVehicle($vehicle);

        return $this->successResponse(
            message: 'Vehicle deleted successfully.'
        );
    }

    /**
     * GET /api/v1/vehicles/featured
     */
    public function featured(): JsonResponse
    {
        return $this->successResponse(
            data: VehicleResource::collection($this->vehicleService->getFeaturedVehicles()),
            message: 'Featured vehicles retrieved successfully.'
        );
    }

    /**
     * PATCH /api/v1/vehicles/{vehicle}/toggle-featured
     */
    public function toggleFeatured(string $vehicle): JsonResponse
    {
        $vehicleModel = Vehicle::findOrFail($vehicle);
        $this->authorize('manageAvailability', $vehicleModel);

        return $this->successResponse(
            data: new VehicleResource($this->vehicleService->toggleFeatured($vehicle)),
            message: 'Vehicle featured status toggled.'
        );
    }

    /**
     * PATCH /api/v1/vehicles/{vehicle}/toggle-price-visible
     */
    public function togglePriceVisible(string $vehicle): JsonResponse
    {
        $vehicleModel = Vehicle::findOrFail($vehicle);
        $this->authorize('manageAvailability', $vehicleModel);

        return $this->successResponse(
            data: new VehicleResource($this->vehicleService->togglePriceVisible($vehicle)),
            message: 'Vehicle price visibility toggled.'
        );
    }

    /**
     * GET /api/v1/vehicles/{vehicle}/booked-dates
     */
    public function getBookedDates(Request $request, Vehicle $vehicle): JsonResponse
    {
        $excludeRentalId = $request->query('exclude_rental_id') ?: null;
        $ranges = $this->vehicleRepository->getActiveBookingDateRanges($vehicle, $excludeRentalId);

        return $this->successResponse($ranges);
    }

    /**
     * PATCH /api/v1/vehicles/{vehicle}/status
     * Change the vehicle's availability status (available, rented, maintenance, retired).
     */
    public function updateStatus(UpdateVehicleRequest $request, string $vehicle): JsonResponse
    {
        // Guard: cannot release a vehicle from Maintenance to Available
        // when there is an unresolved damage settlement on a rental.
        $vehicleModel = Vehicle::findOrFail($vehicle);
        if (
            $vehicleModel->status === VehicleStatus::Maintenance &&
            $request->validated('status') === 'available'
        ) {
            $hasPendingDamage = Rental::where('vehicle_id', $vehicle)
                ->where('has_damage', true)
                ->whereIn('status', ['returned', 'completed'])
                ->where(fn ($q) => $q->whereNull('settlement_status')->orWhere('settlement_status', 'pending'))
                ->exists();

            abort_if(
                $hasPendingDamage,
                422,
                'Cannot mark vehicle as available: there is a pending damage settlement. Resolve the rental damage first.'
            );
        }

        return $this->successResponse(
            data: new VehicleResource($this->vehicleService->updateStatus($vehicle, $request->validated('status'))),
            message: 'Vehicle status updated.'
        );
    }
}
