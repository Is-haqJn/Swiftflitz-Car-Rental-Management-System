<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'username' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('users', 'username')->ignore($userId), 'alpha_dash'],
            'password' => ['sometimes', 'nullable', 'string', Password::min(8)->letters()->numbers()],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
            'roles' => ['sometimes', 'nullable', 'array'],
            'roles.*' => ['string', Rule::in(Role::pluck('name')->toArray())], // super_admin, admin, manager, staff, viewer
            'permissions' => ['sometimes', 'nullable', 'array'],
            'permissions.*' => ['string'],
        ];
    }
    

    public function messages(): array
    {
        return [
            'username.alpha_dash' => 'Username may only contain letters, numbers, dashes and underscores.',
        ];
    }
}
