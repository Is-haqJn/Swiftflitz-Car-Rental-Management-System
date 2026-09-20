<?php

namespace App\Services\Contracts;

use Illuminate\Support\Collection;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

interface VehicleImageServiceInterface
{
    /**
     * Get all images for a vehicle, ordered by sort.
     */
    public function getImages(string $vehicleId): Collection;

    /**
     * Upload one or more images for a vehicle.
     *
     * @param  \Illuminate\Http\UploadedFile[]  $files
     * @param  int|null  $primaryIndex  Zero-based index of the file to set as primary (null = first image when no images exist)
     */
    public function uploadImages(string $vehicleId, array $files, ?int $primaryIndex = null): Collection;

    /**
     * Set an image as the primary image.
     */
    public function setPrimary(string $vehicleId, string $mediaId): Media;

    /**
     * Delete a single image.
     */
    public function deleteImage(string $vehicleId, string $mediaId): bool;

    /**
     * Reorder images for a vehicle.
     * Expects an array of media IDs in desired order.
     */
    public function reorderImages(string $vehicleId, array $orderedIds): Collection;
}
