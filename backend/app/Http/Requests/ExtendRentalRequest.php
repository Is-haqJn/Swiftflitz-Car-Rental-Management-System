<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExtendRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_return_date' => ['required', 'date', 'after:today'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
