<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAirportCancellationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'free_cancellation_hours' => ['sometimes', 'integer', 'min:0'],
            'cancellation_fee_type' => ['sometimes', 'in:flat,percentage'],
            'cancellation_fee_amount' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
