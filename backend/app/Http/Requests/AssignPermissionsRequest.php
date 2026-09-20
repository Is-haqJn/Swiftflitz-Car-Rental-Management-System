<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'permissions.required' => 'Permissions array is required.',
        ];
    }
}
