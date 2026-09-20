<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCancellationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'free_cancellation_window_hours' => ['sometimes', 'integer', 'min:0'],
            'no_show_grace_period_hours' => ['sometimes', 'integer', 'min:0'],
            'before_pickup_cancellation_fee' => ['sometimes', 'numeric', 'min:0'],
            'modification_fee' => ['sometimes', 'numeric', 'min:0'],
            'modification_free_window_hours' => ['sometimes', 'integer', 'min:0'],
            'after_pickup_cancellation_fee' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
