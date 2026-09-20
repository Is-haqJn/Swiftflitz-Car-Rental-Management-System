<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->ignore($this->route('role'), 'name'),
            ],
            'description' => ['sometimes', 'string', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A role with this name already exists.',
            'description.max' => 'Description cannot exceed 255 characters.',
            'permissions.*.exists' => 'One or more permissions are invalid.',
        ];
    }
}
