<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AssignRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::exists(Role::class, 'name')],
        ];
    }

    public function messages(): array
    {
        return [
            'roles.required' => 'At least one role must be provided.',
            'roles.*.exists' => 'Invalid role provided. The role does not exist.',
        ];
    }
}
