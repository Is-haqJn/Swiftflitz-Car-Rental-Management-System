<?php

namespace App\Http\Controllers\V1;

use App\DTOs\DriverData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDriverRequest;
use App\Http\Requests\UpdateDriverRequest;
use App\Http\Requests\UpdateDriverStatusRequest;
use App\Http\Requests\UploadDriverIdDocumentRequest;
use App\Http\Requests\UploadDriverLicensePhotoRequest;
use App\Http\Requests\UploadDriverPhotoRequest;
use App\Http\Resources\DriverResource;
use App\Models\Driver;
use App\Services\Contracts\DriverServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DriverController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DriverServiceInterface $driverService
    ) {}

    /**
     * GET /api/v1/drivers
     */
    public function index(): JsonResponse
    {
        $drivers = $this->driverService->getFilteredDrivers(request());

        return $this->successResponse(
            data: DriverResource::collection($drivers),
            message: 'Drivers retrieved successfully'
        );
    }

    /**
     * POST /api/v1/drivers
     */
    public function store(StoreDriverRequest $request): JsonResponse
    {
        $driver = $this->driverService->createDriver(
            DriverData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            data: new DriverResource($driver),
            message: 'Driver created successfully'
        );
    }

    /**
     * GET /api/v1/drivers/{driver}
     */
    public function show(string $id): JsonResponse
    {
        $driver = $this->driverService->getDriver($id);

        return $this->successResponse(
            data: new DriverResource($driver),
            message: 'Driver retrieved successfully'
        );
    }

    /**
     * PUT /api/v1/drivers/{driver}
     */
    public function update(UpdateDriverRequest $request, string $id): JsonResponse
    {
        $driver = $this->driverService->updateDriver(
            $id,
            DriverData::fromRequest($request->validated())
        );

        return $this->successResponse(
            data: new DriverResource($driver),
            message: 'Driver updated successfully'
        );
    }

    /**
     * DELETE /api/v1/drivers/{driver}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->driverService->deleteDriver($id);

        return $this->successResponse(
            data: null,
            message: 'Driver deleted successfully'
        );
    }

    /**
     * PATCH /api/v1/drivers/{driver}/status
     */
    public function updateStatus(UpdateDriverStatusRequest $request, string $id): JsonResponse
    {
        $driver = $this->driverService->updateStatus($id, $request->validated('status'));

        return $this->successResponse(
            data: new DriverResource($driver),
            message: 'Driver status updated successfully'
        );
    }

    /**
     * GET /api/v1/drivers/available/chauffeur
     */
    public function availableForChauffeur(): JsonResponse
    {
        $drivers = $this->driverService->getAvailableForChauffeur();

        return $this->successResponse(
            data: DriverResource::collection($drivers),
            message: 'Available chauffeur drivers retrieved successfully'
        );
    }

    /**
     * GET /api/v1/drivers/available/airport
     */
    public function availableForAirport(): JsonResponse
    {
        $drivers = $this->driverService->getAvailableForAirport();

        return $this->successResponse(
            data: DriverResource::collection($drivers),
            message: 'Available airport drivers retrieved successfully'
        );
    }

    /**
     * POST /api/v1/drivers/{driver}/media/photo
     */
    public function uploadPhoto(UploadDriverPhotoRequest $request, string $id): JsonResponse
    {
        $driver = $this->driverService->getDriver($id);
        $driver->clearMediaCollection('driver_photo');
        $driver->addMedia($request->file('file'))->toMediaCollection('driver_photo');

        return $this->successResponse(
            data: new DriverResource($driver->fresh()),
            message: 'Driver photo uploaded successfully'
        );
    }

    /**
     * POST /api/v1/drivers/{driver}/media/id-document
     */
    public function uploadIdDocument(UploadDriverIdDocumentRequest $request, string $id): JsonResponse
    {
        $driver = $this->driverService->getDriver($id);
        $driver->clearMediaCollection('id_document');
        $driver->addMedia($request->file('file'))->toMediaCollection('id_document');

        return $this->successResponse(
            data: new DriverResource($driver->fresh()),
            message: 'ID document uploaded successfully'
        );
    }

    /**
     * POST /api/v1/drivers/{driver}/media/license-photo
     */
    public function uploadLicensePhoto(UploadDriverLicensePhotoRequest $request, string $id): JsonResponse
    {
        $driver = $this->driverService->getDriver($id);
        $driver->clearMediaCollection('license_photo');
        $driver->addMedia($request->file('file'))->toMediaCollection('license_photo');

        return $this->successResponse(
            data: new DriverResource($driver->fresh()),
            message: 'License photo uploaded successfully'
        );
    }
}
