<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderVehicleImagesRequest;
use App\Http\Requests\UploadVehicleImagesRequest;
use App\Http\Resources\Vehicle\VehicleImageResource;
use App\Services\Contracts\VehicleImageServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class VehicleImageController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected VehicleImageServiceInterface $vehicleImageService
    ) {}

    /**
     * GET /api/v1/vehicles/{vehicle}/images
     */
    public function index(string $vehicle): JsonResponse
    {
        $images = $this->vehicleImageService->getImages($vehicle);

        return $this->successResponse(
            data: VehicleImageResource::collection($images),
            message: 'Vehicle images retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/vehicles/{vehicle}/images
     */
    public function store(UploadVehicleImagesRequest $request, string $vehicle): JsonResponse
    {
        $images = $this->vehicleImageService->uploadImages(
            vehicleId: $vehicle,
            files: $request->validated('images') ?? [],
            primaryIndex: $request->validated('primary_index')
        );

        return $this->createdResponse(
            data: VehicleImageResource::collection($images),
            message: 'Images uploaded successfully.'
        );
    }

    /**
     * PATCH /api/v1/vehicles/{vehicle}/images/{media}/primary
     */
    public function setPrimary(string $vehicle, string $media): JsonResponse
    {
        $updated = $this->vehicleImageService->setPrimary($vehicle, $media);

        return $this->successResponse(
            data: new VehicleImageResource($updated),
            message: 'Primary image updated.'
        );
    }

    /**
     * PUT /api/v1/vehicles/{vehicle}/images/reorder
     */
    public function reorder(ReorderVehicleImagesRequest $request, string $vehicle): JsonResponse
    {
        $images = $this->vehicleImageService->reorderImages(
            vehicleId: $vehicle,
            orderedIds: $request->validated('image_ids'),
        );

        return $this->successResponse(
            data: VehicleImageResource::collection($images),
            message: 'Images reordered successfully.'
        );
    }

    /**
     * DELETE /api/v1/vehicles/{vehicle}/images/{media}
     */
    public function destroy(string $vehicle, string $media): JsonResponse
    {
        $this->vehicleImageService->deleteImage($vehicle, $media);

        return $this->successResponse(
            message: 'Image deleted successfully.'
        );
    }
}
