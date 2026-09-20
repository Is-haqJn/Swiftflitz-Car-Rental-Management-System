<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'required|string|max:500',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'security_deposit' => 'nullable|numeric|min:0',
            'young_driver_age_threshold' => 'nullable|integer|min:16|max:35',
            'young_driver_deposit' => 'nullable|numeric|min:0',
            'cancellation_fee' => 'nullable|numeric|min:0',
            'before_pickup_cancellation_fee' => 'nullable|numeric|min:0',
            'after_pickup_cancellation_fee' => 'nullable|numeric|min:0',
            'overdue_fee' => 'nullable|numeric|min:0',
        ];
    }
}
