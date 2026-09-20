<?php

namespace App\Services;

use App\DTOs\AirportData;
use App\Models\Airport;
use App\Models\Branch;
use App\Repositories\Contracts\AirportRepositoryInterface;
use App\Services\Contracts\AirportServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AirportService implements AirportServiceInterface
{
    public function __construct(
        protected AirportRepositoryInterface $airportRepository,
    ) {}

    public function getAll(): LengthAwarePaginator
    {
        return $this->airportRepository->paginateFiltered();
    }

    public function getActive(): Collection
    {
        return $this->airportRepository->getActive();
    }

    public function getAirport(string $id): Airport
    {
        return $this->airportRepository->getAirport($id);
    }

    public function create(AirportData $data): Airport
    {
        $airport = $this->airportRepository->createAirport($data->toArray());

        $user = auth()->user();
        $branchIds = $data->branch_ids ?? [];

        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $userBranches = $user->branches()->pluck('id')->toArray();
            if (count($userBranches) === 1) {
                // Single-branch manager: auto-link silently
                $branchIds = $userBranches;
            }
            // Multi-branch manager: branch_ids comes from the request
        }

        if (! empty($branchIds)) {
            Branch::whereIn('id', $branchIds)->update(['airport_id' => $airport->id]);
        }

        return $airport;
    }

    public function update(string $id, array $data): Airport
    {
        return $this->airportRepository->updateAirport($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->airportRepository->deleteAirport($id);
    }

    public function toggleActive(string $id): Airport
    {
        $airport = $this->airportRepository->findOrFail($id);
        $airport->is_active = ! $airport->is_active;
        $airport->save();

        return $airport->fresh();
    }

    public function setAsDefault(string $id): Airport
    {
        return DB::transaction(function () use ($id) {
            $airport = $this->airportRepository->findOrFail($id);
            $this->airportRepository->unsetDefault($id);
            $airport->is_default = true;
            $airport->save();

            return $airport->fresh();
        });
    }
}
