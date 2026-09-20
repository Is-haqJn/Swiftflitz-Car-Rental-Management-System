<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SwitchVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
