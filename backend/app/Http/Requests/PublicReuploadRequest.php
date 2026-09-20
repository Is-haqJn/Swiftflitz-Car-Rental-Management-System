<?php

namespace App\Http\Requests;

use App\Enums\CustomerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PublicReuploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'address' => ['required', 'string', 'max:500'],
            'license_number' => ['required', 'string', 'max:100'],
            'license_expiry_date' => ['required', 'date', 'after:today'],
            'id_type' => ['required', 'string', Rule::in(CustomerIdType::list())],
            'id_number' => ['required', 'string', 'max:100'],
            'license_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
            'id_document_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ];
    }
}
