<?php

namespace App\Http\Requests;

use App\Enums\CustomerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customerId = $this->route('customer');

        return [
            // Required fields
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('customers', 'email')->ignore($customerId)],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string'],
            'license_number' => ['required', 'string', 'max:255', Rule::unique('customers', 'license_number')->ignore($customerId)],
            'license_expiry_date' => ['required', 'date', 'after:today'],
            'id_type' => ['required', 'string', Rule::in(CustomerIdType::list())], // ghana_card, passport, voter_id
            'id_number' => ['required', 'string', 'max:50'],

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
            'passport_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
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
