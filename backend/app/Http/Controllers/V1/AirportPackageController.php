<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportPackageData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAirportPackageRequest;
use App\Http\Requests\UpdateAirportPackageRequest;
use App\Http\Requests\UploadAirportPackagePhotoRequest;
use App\Http\Resources\AirportPackageResource;
use App\Models\AirportPackage;
use App\Services\Contracts\AirportPackageServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AirportPackageController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportPackageServiceInterface $packageService,
    ) {}

    /**
     * GET /api/v1/airport-packages
     */
    public function index(): JsonResponse
    {
        $packages = $this->packageService->getAll();

        return $this->successResponse(AirportPackageResource::collection($packages));
    }

    /**
     * GET /api/v1/airport-packages/for-pickup
     */
    public function forPickup(): JsonResponse
    {
        $packages = $this->packageService->getForPickup();

        return $this->successResponse(AirportPackageResource::collection($packages));
    }

    /**
     * GET /api/v1/airport-packages/for-dropoff
     */
    public function forDropoff(): JsonResponse
    {
        $packages = $this->packageService->getForDropoff();

        return $this->successResponse(AirportPackageResource::collection($packages));
    }

    /**
     * POST /api/v1/airport-packages
     */
    public function store(StoreAirportPackageRequest $request): JsonResponse
    {
        $package = $this->packageService->create(AirportPackageData::fromRequest($request->validated()));

        return $this->createdResponse(new AirportPackageResource($package), 'Airport package created successfully.');
    }

    /**
     * GET /api/v1/airport-packages/{airportPackage}
     */
    public function show(AirportPackage $airportPackage): JsonResponse
    {
        return $this->successResponse(new AirportPackageResource($airportPackage));
    }

    /**
     * PUT /api/v1/airport-packages/{airportPackage}
     */
    public function update(UpdateAirportPackageRequest $request, AirportPackage $airportPackage): JsonResponse
    {
        $updated = $this->packageService->update($airportPackage->id, $request->validated());

        return $this->successResponse(new AirportPackageResource($updated), 'Airport package updated successfully.');
    }

    /**
     * DELETE /api/v1/airport-packages/{airportPackage}
     */
    public function destroy(AirportPackage $airportPackage): JsonResponse
    {
        $this->packageService->delete($airportPackage->id);

        return $this->noContentResponse();
    }

    /**
     * POST /api/v1/airport-packages/{airportPackage}/photo
     */
    public function uploadPhoto(UploadAirportPackagePhotoRequest $request, AirportPackage $airportPackage): JsonResponse
    {
        $airportPackage->clearMediaCollection('package_photo');
        $airportPackage->addMedia($request->file('file'))->toMediaCollection('package_photo');

        return $this->successResponse(new AirportPackageResource($airportPackage->fresh()), 'Photo uploaded successfully.');
    }

    /**
     * PATCH /api/v1/airport-packages/{airportPackage}/toggle-active
     */
    public function toggleActive(AirportPackage $airportPackage): JsonResponse
    {
        $updated = $this->packageService->toggleActive($airportPackage->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new AirportPackageResource($updated), "Airport package {$status} successfully.");
    }
}
