<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAirportCancellationSettingsRequest;
use App\Services\Contracts\AirportCancellationSettingsServiceInterface;
use App\Settings\AirportCancellationSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AirportCancellationSettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportCancellationSettingsServiceInterface $settingsService
    ) {}

    /**
     * GET /api/v1/airport-cancellation-settings
     */
    public function show(AirportCancellationSettings $settings): JsonResponse
    {
        return $this->successResponse($this->settingsService->getSettings($settings));
    }

    /**
     * PUT /api/v1/airport-cancellation-settings
     */
    public function update(UpdateAirportCancellationSettingsRequest $request, AirportCancellationSettings $settings): JsonResponse
    {
        $updated = $this->settingsService->updateSettings($settings, $request->validated());

        return $this->successResponse($updated->toArray(), 'Airport cancellation settings updated successfully.');
    }
}
