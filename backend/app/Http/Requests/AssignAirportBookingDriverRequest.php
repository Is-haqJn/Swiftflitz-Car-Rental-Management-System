<?php

namespace App\Http\Requests;

use App\Enums\AirportAssignmentMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignAirportBookingDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
            'vehicle_id' => ['nullable', 'uuid', 'exists:fleet_vehicles,id'],
            'assignment_mode' => ['nullable', 'string', Rule::in(AirportAssignmentMode::list())],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (empty($this->driver_id) && empty($this->vehicle_id)) {
                $validator->errors()->add('driver_id', 'At least a driver or a vehicle must be assigned.');
            }
        });
    }
}
