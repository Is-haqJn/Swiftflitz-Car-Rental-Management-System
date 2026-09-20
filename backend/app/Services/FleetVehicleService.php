<?php

namespace App\Services;

use App\DTOs\FleetVehicleData;
use App\Models\FleetServiceAssignment;
use App\Models\FleetVehicle;
use App\Repositories\Contracts\FleetVehicleRepositoryInterface;
use App\Services\Contracts\FleetVehicleServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class FleetVehicleService implements FleetVehicleServiceInterface
{
    public function __construct(
        protected FleetVehicleRepositoryInterface $fleetVehicleRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->fleetVehicleRepository->getAll();
    }

    public function getVehicle(string $id): FleetVehicle
    {
        return $this->fleetVehicleRepository->getVehicle($id);
    }

    public function create(FleetVehicleData $data): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->createVehicle($data->toArray());

        $this->syncAirportAssignments($vehicle, $data->airport_packages ?? []);
        $this->syncChauffeurAssignment($vehicle, $data->chauffeur_service);

        return $vehicle->load(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    public function update(string $id, FleetVehicleData $data): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->updateVehicle($id, $data->toArray());

        $this->syncAirportAssignments($vehicle, $data->airport_packages ?? []);
        $this->syncChauffeurAssignment($vehicle, $data->chauffeur_service);

        return $vehicle->load(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    public function delete(string $id): bool
    {
        return $this->fleetVehicleRepository->deleteVehicle($id);
    }

    public function updateStatus(string $id, string $status): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->findOrFail($id);
        $vehicle->status = $status;
        $vehicle->save();

        return $vehicle->fresh(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    public function toggleActive(string $id): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->findOrFail($id);
        $vehicle->is_active = ! $vehicle->is_active;
        $vehicle->save();

        return $vehicle->fresh(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    public function getAvailableForAirport(): Collection
    {
        return $this->fleetVehicleRepository->getAvailableForAirport();
    }

    public function getAvailableForChauffeur(bool $featuredOnly = false): Collection
    {
        return $this->fleetVehicleRepository->getAvailableForChauffeur($featuredOnly);
    }

    public function setPrimaryPhoto(string $id, string $mediaId): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->getVehicle($id);
        $media = $vehicle->getMedia('photos');

        $ordered = collect([$mediaId])
            ->merge($media->where('id', '!=', $mediaId)->pluck('id'))
            ->values()
            ->toArray();

        Media::setNewOrder($ordered);

        return $vehicle->fresh(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    public function assignServices(string $id, array $data): FleetVehicle
    {
        $vehicle = $this->fleetVehicleRepository->findOrFail($id);

        $chauffeurService = null;
        if (! empty($data['chauffeur_enabled']) && ! empty($data['chauffeur_category_id'])) {
            $chauffeurService = [
                'category_id' => $data['chauffeur_category_id'],
                'base_price' => $data['chauffeur_base_price'],
            ];
        }

        $this->syncChauffeurAssignment($vehicle, $chauffeurService);
        $this->syncAirportAssignments($vehicle, $data['airport_package_ids'] ?? []);

        return $vehicle->fresh(['serviceAssignments.package', 'serviceAssignments.category', 'branch', 'defaultDriver', 'media']);
    }

    /* Service Assignment Sync */
    protected function syncAirportAssignments(FleetVehicle $vehicle, array $packageIds): void
    {
        // Remove airport rows no longer in the list
        $vehicle->airportAssignments()
            ->when(! empty($packageIds), fn ($q) => $q->whereNotIn('package_id', $packageIds))
            ->delete();

        foreach ($packageIds as $packageId) {
            FleetServiceAssignment::updateOrCreate(
                [
                    'vehicle_id' => $vehicle->id,
                    'service_type' => 'airport',
                    'package_id' => $packageId,
                ],
                ['is_active' => true]
            );
        }
    }

    protected function syncChauffeurAssignment(FleetVehicle $vehicle, ?array $chauffeurData): void
    {
        if ($chauffeurData === null) {
            $vehicle->chauffeurAssignment()->delete();

            return;
        }

        FleetServiceAssignment::updateOrCreate(
            [
                'vehicle_id' => $vehicle->id,
                'service_type' => 'chauffeur',
            ],
            [
                'package_id' => null,
                'category_id' => $chauffeurData['category_id'],
                'base_price' => $chauffeurData['base_price'],
                'is_active' => true,
            ]
        );
    }
}
