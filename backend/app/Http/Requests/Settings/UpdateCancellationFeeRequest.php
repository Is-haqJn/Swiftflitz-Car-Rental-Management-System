<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCancellationFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'before_pickup_fee'  => ['required', 'numeric', 'min:0'],
            'after_pickup_fee'   => ['required', 'numeric', 'min:0'],
            'before_pickup_days' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'before_pickup_fee.required'  => 'The before-pickup cancellation fee is required.',
            'before_pickup_fee.numeric'   => 'The before-pickup fee must be a number.',
            'before_pickup_fee.min'       => 'The before-pickup fee cannot be negative.',
            'after_pickup_fee.required'   => 'The after-pickup cancellation fee is required.',
            'after_pickup_fee.numeric'    => 'The after-pickup fee must be a number.',
            'after_pickup_fee.min'        => 'The after-pickup fee cannot be negative.',
            'before_pickup_days.required' => 'The free-window threshold (days) is required.',
            'before_pickup_days.integer'  => 'The free-window threshold must be a whole number.',
            'before_pickup_days.min'      => 'The free-window threshold cannot be negative.',
        ];
    }
}
