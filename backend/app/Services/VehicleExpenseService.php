<?php

namespace App\Services;

use App\DTOs\VehicleExpenseData;
use App\Models\Branch;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use App\Repositories\Contracts\VehicleExpenseRepositoryInterface;
use App\Services\Contracts\VehicleExpenseServiceInterface;
use Illuminate\Support\Facades\DB;

class VehicleExpenseService implements VehicleExpenseServiceInterface
{
    public function __construct(
        private readonly VehicleExpenseRepositoryInterface $repository,
    ) {}

    public function store(VehicleExpenseData $data, array $imageFiles): VehicleExpense
    {
        $vehicle = Vehicle::with('branch:id,currency,currency_symbol,exchange_rate')
            ->findOrFail($data->vehicleId);

        $branch = $vehicle->branch;

        $enriched = VehicleExpenseData::fromRequest(array_merge($data->toArray(), [
            'vehicle_id' => $data->vehicleId,
            'type' => $data->type,
            'currency' => $branch?->currency ?? null,
            'currency_symbol' => $branch?->currency_symbol ?? null,
            'exchange_rate' => $branch?->exchange_rate ?? null,
        ]));

        $expense = $this->repository->create($enriched->toArray());

        foreach ($imageFiles as $file) {
            $expense->addMedia($file)
                ->toMediaCollection('receipts');
        }

        return $expense->refresh();
    }

    public function completeMaintenance(Vehicle $vehicle, VehicleExpenseData $data, array $imageFiles): Vehicle
    {
        $branch = $vehicle->branch ?? Branch::find($vehicle->branch_id);

        $enriched = VehicleExpenseData::fromRequest(array_merge($data->toArray(), [
            'vehicle_id' => $data->vehicleId,
            'type' => $data->type,
            'currency' => $branch?->currency ?? null,
            'currency_symbol' => $branch?->currency_symbol ?? null,
            'exchange_rate' => $branch?->exchange_rate ?? null,
        ]));

        $expense = DB::transaction(function () use ($vehicle, $enriched) {
            $expense = $this->repository->create($enriched->toArray());
            $vehicle->update(['status' => 'available']);

            return $expense;
        });

        foreach ($imageFiles as $file) {
            $expense->addMedia($file)
                ->toMediaCollection('receipts');
        }

        return $vehicle->fresh();
    }
}
