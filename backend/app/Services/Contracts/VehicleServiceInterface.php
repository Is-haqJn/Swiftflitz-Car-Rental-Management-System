<?php

namespace App\Services\Contracts;

use App\DTOs\VehicleData;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

interface VehicleServiceInterface
{
    public function getVehicles(): Collection;

    /**
     * Get paginated vehicle list with filters.
     */
    public function getFilteredVehicles(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get featured vehicles for homepage/listings.
     */
    public function getFeaturedVehicles(int $limit = 10): Collection;

    /**
     * Get vehicles by category.
     */
    public function getVehiclesByCategory(string $categoryId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get vehicles by status.
     */
    public function getVehiclesByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a single vehicle by ID.
     */
    public function getVehicle(string $id): Vehicle;

    /**
     * Create a new vehicle.
     */
    public function createVehicle(VehicleData $data): Vehicle;

    /**
     * Update an existing vehicle.
     */
    public function updateVehicle(string $id, array $data): Vehicle;

    /**
     * Delete a vehicle.
     */
    public function deleteVehicle(string $id): bool;

    /**
     * Toggle featured status.
     */
    public function toggleFeatured(string $id): Vehicle;

    /**
     * Toggle price visibility.
     */
    public function togglePriceVisible(string $id): Vehicle;

    /**
     * Update vehicle status.
     */
    public function updateStatus(string $id, string $status): Vehicle;
}
