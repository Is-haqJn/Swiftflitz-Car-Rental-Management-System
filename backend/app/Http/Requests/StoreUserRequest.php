<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users', 'username'), 'alpha_dash'],
            'password' => ['nullable', 'string', Password::min(8)->letters()->numbers()],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::in(Role::pluck('name')->toArray())], // super_admin, admin, manager, staff, viewer
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.alpha_dash' => 'Username may only contain letters, numbers, dashes and underscores.',
            'password.min' => 'Password must be at least 8 characters.',
        ];
    }
}
