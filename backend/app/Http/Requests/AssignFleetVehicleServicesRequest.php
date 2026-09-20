<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignFleetVehicleServicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'chauffeur_enabled' => ['required', 'boolean'],
            'chauffeur_category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'chauffeur_base_price' => ['nullable', 'numeric', 'min:0'],
            'airport_enabled' => ['required', 'boolean'],
            'airport_package_ids' => ['nullable', 'array'],
            'airport_package_ids.*' => ['uuid', 'exists:airport_packages,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->boolean('chauffeur_enabled')) {
                if (empty($this->input('chauffeur_category_id'))) {
                    $validator->errors()->add('chauffeur_category_id', 'Vehicle category is required for chauffeur service.');
                }
                if (is_null($this->input('chauffeur_base_price'))) {
                    $validator->errors()->add('chauffeur_base_price', 'Base price is required for chauffeur service.');
                }
            }
        });
    }
}
