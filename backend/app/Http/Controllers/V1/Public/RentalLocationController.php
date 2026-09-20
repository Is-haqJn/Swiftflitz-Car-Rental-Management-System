<?php

namespace App\Http\Controllers\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\RentalLocation;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RentalLocationController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/rental-locations/pickup
     * Active pickup locations for the public booking form.
     */
    public function pickup(): JsonResponse
    {
        $locations = RentalLocation::where('is_active', true)
            ->where('is_pickup', true)
            ->when(request('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->orderBy('name')
            ->with('branch')
            ->get()
            ->map(fn (RentalLocation $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'pickup_charge' => $l->pickup_charge,
                'currency_symbol' => $l->branch?->currency_symbol,
                'is_airport' => false,
            ]);

        return $this->successResponse($locations, 'Pickup locations retrieved successfully');
    }

    /**
     * GET /api/v1/public/rental-locations/dropoff
     * Active dropoff locations for the public booking form.
     */
    public function dropoff(): JsonResponse
    {
        $locations = RentalLocation::where('is_active', true)
            ->where('is_dropoff', true)
            ->when(request('branch_id'), fn ($q, $v) => $q->where('branch_id', $v))
            ->orderBy('name')
            ->with('branch')
            ->get()
            ->map(fn (RentalLocation $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'dropoff_charge' => $l->dropoff_charge,
                'currency_symbol' => $l->branch?->currency_symbol,
                'is_airport' => false,
            ]);

        return $this->successResponse($locations, 'Dropoff locations retrieved successfully');
    }
}
