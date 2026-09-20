<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignChauffeurDriverRequest extends FormRequest
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
        ];
    }
}
