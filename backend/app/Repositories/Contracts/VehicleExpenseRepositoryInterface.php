<?php

namespace App\Repositories\Contracts;

use App\Models\VehicleExpense;
use Illuminate\Pagination\LengthAwarePaginator;

interface VehicleExpenseRepositoryInterface
{
    public function create(array $data): VehicleExpense;

    public function listForVehicle(string $vehicleId, array $filters = []): LengthAwarePaginator;
}
