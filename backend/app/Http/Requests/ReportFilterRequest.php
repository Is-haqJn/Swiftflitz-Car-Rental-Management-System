<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date', 'before_or_equal:end_date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'manager_id' => ['nullable', 'uuid', 'exists:users,id'],
            'vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'format' => ['nullable', 'string', 'in:json,pdf,excel'],
            'limit' => ['nullable', 'integer', 'min:0'],
            'chart_period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.before_or_equal' => 'Start date must be before or equal to end date.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
        ];
    }

    /**
     * Return validated filters as array for service consumption.
     *
     * @return array<string, mixed>
     */
    public function toFilters(): array
    {
        return array_filter($this->validated(), fn ($v) => $v !== null);
    }
}
