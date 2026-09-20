<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignManagersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_ids' => ['array'],
            'user_ids.*' => ['string', 'exists:users,id'],
        ];
    }
}
