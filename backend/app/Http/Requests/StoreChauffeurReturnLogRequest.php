<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChauffeurReturnLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'returned_at' => ['nullable', 'date'],
            'odometer_reading' => ['nullable', 'integer', 'min:0'],
            'condition_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
