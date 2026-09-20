<?php

namespace App\Services;

use App\DTOs\VehicleData;
use App\Models\Vehicle;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Services\Contracts\VehicleServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class VehicleService implements VehicleServiceInterface
{
    public function __construct(
        protected VehicleRepositoryInterface $vehicleRepository
    ) {}

    public function getVehicles(): Collection
    {
        return $this->vehicleRepository->getVehicles();
    }

    /**
     * Get paginated vehicle list with filters.
     */
    public function getFilteredVehicles(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->vehicleRepository->paginateFiltered($perPage);
    }

    /**
     * Get a single vehicle by ID.
     */
    public function getVehicle(string $id): Vehicle
    {
        return $this->vehicleRepository->getVehicle($id);
    }

    /**
     * Create a new vehicle.
     */
    public function createVehicle(VehicleData $vehicleData): Vehicle
    {
        return $this->vehicleRepository->create($vehicleData->toArray());
    }

    /**
     * Update an existing vehicle.
     */
    public function updateVehicle(string $id, array $data): Vehicle
    {
        return $this->vehicleRepository->update($id, $data);
    }

    /**
     * Delete a vehicle.
     * Spatie auto-deletes associated media when the model is deleted.
     */
    public function deleteVehicle(string $id): bool
    {
        $vehicle = $this->vehicleRepository->find($id);

        $activeStatuses = ['pending', 'confirmed', 'active', 'overdue', 'returned'];

        $hasActiveRental = $vehicle->rentals()
            ->whereIn('status', $activeStatuses)
            ->exists();

        if ($hasActiveRental) {
            abort(422, 'This vehicle has an active rental and cannot be deleted until it is resolved.');
        }

        return $this->vehicleRepository->delete($id);
    }

    /**
     * Get featured vehicles for homepage/listings.
     */
    public function getFeaturedVehicles(int $limit = 10): Collection
    {
        return $this->vehicleRepository->getFeatured($limit);
    }

    /**
     * Get vehicles by category.
     */
    public function getVehiclesByCategory(string $categoryId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->vehicleRepository->getByCategory($categoryId, $perPage);
    }

    /**
     * Get vehicles by status.
     */
    public function getVehiclesByStatus(string $status, int $perPage = 15): LengthAwarePaginator
    {
        return $this->vehicleRepository->getByStatus($status, $perPage);
    }

    /**
     * Toggle featured status.
     */
    public function toggleFeatured(string $id): Vehicle
    {
        $vehicle = $this->vehicleRepository->getVehicle($id);

        return $this->vehicleRepository->update($id, [
            'is_featured' => ! $vehicle->is_featured,
        ]);
    }

    /**
     * Toggle price visibility.
     */
    public function togglePriceVisible(string $id): Vehicle
    {
        $vehicle = $this->vehicleRepository->getVehicle($id);

        return $this->vehicleRepository->update($id, [
            'price_visible' => ! $vehicle->price_visible,
        ]);
    }

    /**
     * Update vehicle status.
     */
    public function updateStatus(string $id, string $status): Vehicle
    {
        return $this->vehicleRepository->update($id, [
            'status' => $status,
        ]);
    }
}
