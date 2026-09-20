<?php

namespace App\Http\Controllers\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RentalTrackingController extends Controller
{
    use ApiResponse;

    public function track(string $reference): JsonResponse
    {
        $rental = Rental::where('reference', $reference)
            ->with(['vehicle', 'vehicle.media', 'pickupLocation', 'dropoffLocation'])
            ->first();

        if (! $rental) {
            return $this->errorResponse('Rental not found.', 404);
        }

        $vehicle = $rental->vehicle;
        $vehicleName = trim($vehicle->make . ' ' . $vehicle->model)
            . ($vehicle->year ? ' (' . $vehicle->year . ')' : '');

        $primary = $vehicle->getMedia('images')->first(fn ($m) => $m->getCustomProperty('is_primary'))
            ?? $vehicle->getMedia('images')->first();
        $image = $primary
            ? ($primary->hasGeneratedConversion('medium') ? $primary->getUrl('medium') : $primary->getUrl('thumb'))
            : null;

        return $this->successResponse([
            'reference' => $rental->reference,
            'status' => $rental->status->value,
            'payment_status' => $rental->payment_status?->value,
            'vehicle' => [
                'name' => $vehicleName,
                'image' => $image,
            ],
            'pickup_date' => $rental->pickup_date->format('Y-m-d'),
            'return_date' => $rental->return_date->format('Y-m-d'),
            'pickup_location' => $rental->pickupLocation?->name ?? $rental->pickup_location,
            'dropoff_location' => $rental->dropoffLocation?->name ?? $rental->dropoff_location,
        ]);
    }
}
