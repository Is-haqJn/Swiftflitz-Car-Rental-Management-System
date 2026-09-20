<?php

namespace App\Http\Requests;

use App\Enums\CustomerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PublicConfirmQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Customer details
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_alt_phone' => ['nullable', 'string', 'max:20'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'customer_date_of_birth' => ['nullable', 'date', 'before:today'],

            // License & ID
            'license_number' => ['required', 'string', 'max:100'],
            'license_expiry_date' => ['required', 'date', 'after:today'],
            'id_type' => ['required', 'string', Rule::in(CustomerIdType::list())],
            'id_number' => ['required', 'string', 'max:100'],

            // Rental times (dates come from the quote)
            'pickup_time' => ['required', 'date_format:H:i'],
            'return_time' => ['required', 'date_format:H:i'],

            // Document uploads (optional - can be submitted later)
            'license_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'id_document_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],

            // Optional extras
            'dropoff_location_id' => ['nullable', 'uuid', Rule::exists('rental_locations', 'id')],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'pickup_time.date_format' => 'Pickup time must be in HH:MM format.',
            'return_time.date_format' => 'Return time must be in HH:MM format.',
            'license_expiry_date.after' => 'License must not be expired.',
            'customer_date_of_birth.before' => 'Date of birth must be in the past.',
        ];
    }
}
