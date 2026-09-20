<?php

namespace App\Http\Requests;

use App\Enums\DriverIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Required fields
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:20', Rule::unique('drivers', 'phone_number')],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'license_number' => ['required', 'string', 'max:255', Rule::unique('drivers', 'license_number')],
            'license_class' => ['required', 'string', 'max:50'],
            'license_expiry_date' => ['required', 'date', 'after:today'],

            // Optional with validation
            'email' => ['nullable', 'email', Rule::unique('drivers', 'email')],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'id_type' => ['nullable', 'string', Rule::in(DriverIdType::list())],
            'id_number' => ['nullable', 'string', 'max:100', Rule::unique('drivers', 'id_number')],
            'id_expiry_date' => ['nullable', 'date'],
            'license_verified' => ['nullable', 'boolean'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_relation' => ['nullable', 'string', 'max:100'],
            'available_for_chauffeur' => ['nullable', 'boolean'],
            'available_for_airport' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', Rule::in(['available', 'on_trip', 'off_duty', 'suspended', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'license_expiry_date.after' => 'License expiry date must be a future date.',
            'date_of_birth.before' => 'Date of birth must be in the past.',
        ];
    }
}
