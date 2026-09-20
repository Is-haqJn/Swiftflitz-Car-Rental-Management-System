<?php

namespace App\Services\Contracts;

use App\DTOs\VehicleExpenseData;
use App\Models\Vehicle;
use App\Models\VehicleExpense;

interface VehicleExpenseServiceInterface
{
    public function store(VehicleExpenseData $data, array $imageFiles): VehicleExpense;

    public function completeMaintenance(Vehicle $vehicle, VehicleExpenseData $data, array $imageFiles): Vehicle;
}
