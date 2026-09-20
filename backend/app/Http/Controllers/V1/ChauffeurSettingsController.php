<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateChauffeurSettingsRequest;
use App\Services\Contracts\ChauffeurSettingsServiceInterface;
use App\Settings\ChauffeurSettings;
use App\Settings\RentalSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ChauffeurSettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChauffeurSettingsServiceInterface $settingsService
    ) {}

    /**
     * GET /api/v1/public/chauffeur-settings
     */
    public function showPublic(ChauffeurSettings $settings, RentalSettings $rentalSettings): JsonResponse
    {
        return $this->successResponse(array_merge(
            $this->settingsService->getPublicSettings($settings),
            ['vat_rate' => (float) $rentalSettings->vat_rate],
        ));
    }

    /**
     * GET /api/v1/chauffeur-settings
     */
    public function show(ChauffeurSettings $settings): JsonResponse
    {
        return $this->successResponse($this->settingsService->getSettings($settings));
    }

    /**
     * PUT /api/v1/chauffeur-settings
     */
    public function update(UpdateChauffeurSettingsRequest $request, ChauffeurSettings $settings): JsonResponse
    {
        $updated = $this->settingsService->updateSettings($settings, $request->validated());

        return $this->successResponse($updated->toArray(), 'Chauffeur settings updated successfully.');
    }
}
