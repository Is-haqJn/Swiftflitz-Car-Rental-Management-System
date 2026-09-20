<?php

namespace App\Http\Requests;

use App\Enums\FleetVehicleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFleetVehicleStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(FleetVehicleStatus::list())],
        ];
    }
}
