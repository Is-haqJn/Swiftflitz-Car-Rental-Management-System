<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'admin_base_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
