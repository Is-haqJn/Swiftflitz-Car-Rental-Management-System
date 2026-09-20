<?php

namespace App\Http\Controllers\V1;

use App\DTOs\VehicleExpenseData;
use App\Enums\VehicleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteMaintenanceRequest;
use App\Http\Requests\StoreVehicleExpenseRequest;
use App\Http\Resources\Vehicle\VehicleResource;
use App\Http\Resources\VehicleExpenseResource;
use App\Models\Vehicle;
use App\Services\Contracts\VehicleExpenseServiceInterface;
use App\Services\TusUpload\TusTempFileResolver;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class VehicleExpenseController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly VehicleExpenseServiceInterface $service,
        private readonly TusTempFileResolver $tusResolver,
    ) {}

    public function store(StoreVehicleExpenseRequest $request): JsonResponse
    {
        $data = VehicleExpenseData::fromRequest(
            array_merge($request->validated(), ['recorded_by' => auth()->id()])
        );
        $imageFiles = array_merge(
            $request->file('receipts') ?? [],
            $this->tusResolver->resolveMany($request->input('receipt_tus_tokens', []))
        );

        $expense = $this->service->store($data, $imageFiles);

        return $this->createdResponse(
            new VehicleExpenseResource($expense),
            'Expense recorded successfully'
        );
    }

    public function completeMaintenance(CompleteMaintenanceRequest $request, Vehicle $vehicle): JsonResponse
    {
        if ($vehicle->status !== VehicleStatus::Maintenance) {
            return $this->errorResponse('Vehicle is not in maintenance status', 422);
        }

        $payload = $request->validated();
        $amount = round((float) ($payload['amount'] ?? 0), 2);

        $imageFiles = array_merge(
            $request->file('receipts') ?? [],
            $this->tusResolver->resolveMany($request->input('receipt_tus_tokens', []))
        );

        $data = VehicleExpenseData::fromRequest([
            'vehicle_id' => $vehicle->id,
            'type' => 'maintenance',
            'amount' => $amount,
            'description' => $payload['description'] ?? null,
            'expense_date' => $payload['expense_date'] ?? null,
            'recorded_by' => auth()->id(),
        ]);

        $this->service->completeMaintenance($vehicle, $data, $imageFiles);

        return $this->successResponse(
            new VehicleResource($vehicle->fresh()),
            'Vehicle marked as available'
        );
    }
}
