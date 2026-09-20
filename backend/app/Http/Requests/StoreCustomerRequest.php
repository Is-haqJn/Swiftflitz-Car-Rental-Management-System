<?php

namespace App\Http\Requests;

use App\Enums\CustomerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Required fields
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('customers', 'email')],
            'phone' => ['required', 'string', 'max:20'],

            // Optional profile fields (can be filled later via document request link)
            'address' => ['nullable', 'string'],
            'license_number' => ['nullable', 'string', 'max:255', Rule::unique('customers', 'license_number')],
            'license_expiry_date' => ['nullable', 'date', 'after:today'],
            'id_type' => ['nullable', 'string', Rule::in(CustomerIdType::list())],
            'id_number' => ['nullable', 'string', 'max:50'],

            // Optional fields
            'alt_phone' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'emergency_contact' => ['nullable', 'array'],
            'emergency_contact.name' => ['required_with:emergency_contact', 'string', 'max:255'],
            'emergency_contact.phone' => ['required_with:emergency_contact', 'string', 'max:20'],
            'emergency_contact.relationship' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_blacklisted' => ['nullable', 'boolean'],
            'blacklist_reason' => ['nullable', 'string', 'required_if:is_blacklisted,true'],
        ];
    }

    public function messages(): array
    {
        return [
            'license_expiry_date.after' => 'License must not be expired',
            'date_of_birth.before' => 'Date of birth must be in the past',
            'emergency_contact.name.required_with' => 'Emergency contact name is required when providing emergency contact',
            'emergency_contact.phone.required_with' => 'Emergency contact phone is required when providing emergency contact',
            'blacklist_reason.required_if' => 'Blacklist reason is required when blacklisting a customer',
        ];
    }
}
