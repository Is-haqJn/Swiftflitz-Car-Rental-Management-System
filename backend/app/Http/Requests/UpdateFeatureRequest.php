<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $featureId = $this->route('feature') ?? $this->route('id');

        return [
            'name' => "required|string|max:255|unique:features,name,{$featureId}",
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ];
    }
}
