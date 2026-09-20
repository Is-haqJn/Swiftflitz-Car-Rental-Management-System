<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAirportPackageAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_id' => [
                'required',
                'string',
                'exists:airport_packages,id',
                Rule::unique('airport_package_assignments', 'package_id')
                    ->where('airport_id', $this->input('airport_id')),
            ],
            'airport_id' => ['required', 'string', 'exists:airports,id'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'package_id.unique' => 'This package is already assigned to the selected airport.',
        ];
    }
}
