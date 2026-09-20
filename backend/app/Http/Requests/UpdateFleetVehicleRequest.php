<?php

namespace App\Http\Requests;

use App\Enums\FleetVehicleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFleetVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vehicleId = $this->route('fleetVehicle');

        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:2035'],
            'color' => ['required', 'string', 'max:50'],
            'license_plate' => ['required', 'string', 'max:20', Rule::unique('fleet_vehicles', 'license_plate')->ignore($vehicleId)],
            'seats' => ['required', 'integer', 'min:1', 'max:50'],
            'has_insurance' => ['required', 'boolean'],
            'has_roadworthy' => ['required', 'boolean'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'insurance_expiry_date' => ['nullable', 'date'],
            'roadworthy_expiry_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(FleetVehicleStatus::list())],
            'is_active' => ['boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'airport_packages' => ['nullable', 'array'],
            'airport_packages.*' => ['uuid', 'exists:airport_packages,id'],
            'chauffeur_service' => ['nullable', 'array'],
            'chauffeur_service.category_id' => ['required_with:chauffeur_service', 'uuid', 'exists:categories,id'],
            'chauffeur_service.base_price' => ['required_with:chauffeur_service', 'numeric', 'min:0'],
            'transmission' => ['nullable', 'string', 'in:automatic,manual,semi-automatic'],
            'fuel_type' => ['nullable', 'string', 'in:petrol,diesel,electric,hybrid'],
            'engine' => ['nullable', 'string', 'max:100'],
            'default_driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
            'is_personal_vehicle' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->boolean('is_personal_vehicle') && empty($this->input('default_driver_id'))) {
                $validator->errors()->add('default_driver_id', 'Personal vehicles require a default driver.');
            }
        });
    }
}
