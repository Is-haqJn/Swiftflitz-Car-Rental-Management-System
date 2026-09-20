<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string'],
            'cancelled_by_type' => ['nullable', 'string', 'in:customer,business'],
        ];
    }
}
