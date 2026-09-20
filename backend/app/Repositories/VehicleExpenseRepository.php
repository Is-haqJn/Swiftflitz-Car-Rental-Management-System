<?php

namespace App\Repositories;

use App\Models\VehicleExpense;
use App\Repositories\Base\BaseRepository;
use App\Repositories\Contracts\VehicleExpenseRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class VehicleExpenseRepository extends BaseRepository implements VehicleExpenseRepositoryInterface
{
    public function create(array $data): VehicleExpense
    {
        return VehicleExpense::create($data);
    }

    public function listForVehicle(string $vehicleId, array $filters = []): LengthAwarePaginator
    {
        return VehicleExpense::query()
            ->where('vehicle_id', $vehicleId)
            ->latest('expense_date')
            ->paginate($filters['per_page'] ?? 15);
    }

    protected function model(): string
    {
        return VehicleExpense::class;
    }
}
