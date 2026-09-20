<?php

namespace App\Services;

use App\Exceptions\ImageNotFoundException;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\VehicleImageServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class VehicleImageService implements VehicleImageServiceInterface
{
    protected int $maxImagesPerVehicle = 15;

    public function __construct(
        protected VehicleRepositoryInterface $vehicleRepository
    ) {}

    /**
     * Get all images for a vehicle, ordered by sort.
     */
    public function getImages(string $vehicleId): Collection
    {
        $vehicle = $this->vehicleRepository->findOrFail($vehicleId);

        return $vehicle->getMedia('images');
    }

    /**
     * Upload one or more images for a vehicle.
     *
     * @param  UploadedFile[]  $files
     * @param  int|null  $primaryIndex  Zero-based index of the file that should be set as primary
     */
    public function uploadImages(string $vehicleId, array $files, ?int $primaryIndex = null): Collection
    {
        $vehicle = $this->vehicleRepository->findOrFail($vehicleId);

        $currentCount = $vehicle->getMedia('images')->count();
        $allowedCount = $this->maxImagesPerVehicle - $currentCount;

        if ($allowedCount <= 0) {
            throw ValidationException::withMessages([
                'files' => ["This vehicle already has the maximum of {$this->maxImagesPerVehicle} images."],
            ]);
        }

        $files = array_slice($files, 0, $allowedCount);

        // ? If a primary_index was not explicitly provided, default to the first
        // ? uploaded image when this vehicle currently has no images.
        $resolvedPrimaryIndex = $primaryIndex ?? ($currentCount === 0 ? 0 : null);

        foreach (array_values($files) as $index => $file) {
            $isPrimary = $resolvedPrimaryIndex !== null && $index === $resolvedPrimaryIndex;
            $vehicle->addMedia($file)
                ->withCustomProperties(['is_primary' => $isPrimary])
                ->toMediaCollection('images');
        }

        return $vehicle->fresh()->getMedia('images');
    }

    /**
     * Set an image as the primary image.
     */
    public function setPrimary(string $vehicleId, string $mediaId): Media
    {
        $vehicle = $this->vehicleRepository->findOrFail($vehicleId);

        return DB::transaction(function () use ($vehicle, $mediaId) {
            $vehicle->getMedia('images')->each(function (Media $media) {
                if ($media->getCustomProperty('is_primary')) {
                    $media->setCustomProperty('is_primary', false);
                    $media->save();
                }
            });

            $media = $vehicle->getMedia('images')->firstWhere('id', $mediaId);

            if (! $media) {
                throw new ImageNotFoundException("Image with ID {$mediaId} not found for this vehicle.");
            }

            $media->setCustomProperty('is_primary', true);
            $media->save();

            return $media->refresh();
        });
    }

    /**
     * Delete a single image.
     */
    public function deleteImage(string $vehicleId, string $mediaId): bool
    {
        $vehicle = $this->vehicleRepository->findOrFail($vehicleId);

        return DB::transaction(function () use ($vehicle, $mediaId) {
            $media = $vehicle->getMedia('images')->firstWhere('id', $mediaId);

            if (! $media) {
                throw new ImageNotFoundException("Image with ID {$mediaId} not found for this vehicle.");
            }

            $wasPrimary = $media->getCustomProperty('is_primary', false);

            $media->delete();

            if ($wasPrimary) {
                $next = $vehicle->fresh()->getMedia('images')->first();
                if ($next) {
                    $next->setCustomProperty('is_primary', true);
                    $next->save();
                }
            }

            return true;
        });
    }

    /**
     * Reorder images for a vehicle.
     * Expects an array of media IDs in desired order.
     */
    public function reorderImages(string $vehicleId, array $orderedIds): Collection
    {
        $vehicle = $this->vehicleRepository->findOrFail($vehicleId);

        Media::setNewOrder($orderedIds);

        // Log::info('Vehicle images reordered', ['vehicle_id' => $vehicleId]);

        return $vehicle->getMedia('images');
    }
}
