<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOverdueSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'overdue_start_type' => ['sometimes', 'string', 'in:exact,grace_period'],
            'grace_period_minutes' => ['sometimes', 'integer', 'min:0'],
            'overdue_hourly_rate' => ['sometimes', 'numeric', 'min:0'],
            'prep_buffer_hours' => ['sometimes', 'integer', 'min:0'],
            'overdue_threshold_hours' => ['sometimes', 'integer', 'min:1'],
            'allow_overdue_waive' => ['sometimes', 'boolean'],
            'full_day_late_return_waiver' => ['sometimes', 'boolean'],
        ];
    }
}
