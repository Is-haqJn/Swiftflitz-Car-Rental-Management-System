<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = auth()->id();

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'max:50', Rule::unique('users', 'username')->ignore($userId), 'alpha_dash'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.alpha_dash' => 'Username may only contain letters, numbers, dashes and underscores.',
            'username.unique' => 'This username is already taken.',
        ];
    }
}
