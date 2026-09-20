<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadCustomerDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'max:5'],
            'files.*' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,pdf', 'max:10240'],
        ];
    }
}
