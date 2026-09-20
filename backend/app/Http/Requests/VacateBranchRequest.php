<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VacateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action'           => ['required', 'in:unassign,transfer'],
            'target_branch_id' => [
                'required_if:action,transfer',
                'nullable',
                'string',
                Rule::exists('branches', 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'target_branch_id.required_if' => 'A target branch is required when transferring vehicles.',
            'target_branch_id.exists'       => 'The selected target branch does not exist.',
        ];
    }
}
