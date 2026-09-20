<?php

namespace App\Http\Requests;

use App\Enums\VehicleFuelType;
use App\Enums\VehicleStatus;
use App\Enums\VehicleTransmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'string', Rule::exists('branches', 'id')],
            'category_id' => ['required', 'string', Rule::exists('categories', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'make' => ['required', 'string', 'max:100'],
            'model' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'roadworthy_expiry_date' => ['required', 'date'],
            'insurance_expiry_date' => ['required', 'date'],
            'license_plate' => ['required', 'string', 'max:20', Rule::unique('vehicles', 'license_plate')],
            'vin' => ['nullable', 'string', 'max:17', Rule::unique('vehicles', 'vin')],
            'color' => ['required', 'string', 'max:50'],
            'seats' => ['required', 'integer', 'min:1', 'max:50'],
            'fuel_type' => ['required', 'string', Rule::in(VehicleFuelType::list())], // petrol, diesel, hybrid, electric
            'engine_size' => ['nullable', 'string', 'max:20'],
            'odometer' => ['nullable', 'integer', 'min:0'],
            'has_insurance' => ['sometimes', 'boolean'],
            'has_roadworthy' => ['sometimes', 'boolean'],
            'transmission' => ['required', 'string', Rule::in(VehicleTransmission::list())], // automatic, manual
            'features' => ['nullable', 'array'],
            'features.*' => ['nullable', 'string'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'security_deposit' => ['nullable', 'numeric', 'min:0'],
            'young_driver_age_threshold' => ['nullable', 'integer', 'min:16', 'max:35'],
            'young_driver_deposit' => ['nullable', 'numeric', 'min:0'],
            'price_visible' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', Rule::in(VehicleStatus::list())], // available, rented, maintenance, retired
            'description' => ['nullable', 'string'],
            'condition_notes' => ['nullable', 'string', 'max:1000'],
            'is_featured' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'license_plate.unique' => 'A vehicle with this license plate already exists.',
            'vin.unique' => 'A vehicle with this VIN already exists.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
