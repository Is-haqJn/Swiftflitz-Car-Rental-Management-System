<?php

namespace App\Http\Requests;

use App\Enums\CustomerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class PublicCompleteProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'alt_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:500'],
            'license_number' => ['required', 'string', 'max:100'],
            'license_expiry_date' => ['required', 'date', 'after:today'],
            'license_image' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
            'id_type' => ['required', new Enum(CustomerIdType::class)],
            'id_number' => ['required', 'string', 'max:100'],
            'id_expiry_date' => ['required', 'date', 'after:today'],
            'id_document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
            'passport_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:5120'],
        ];
    }
}
