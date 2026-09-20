<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QueueExportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:rentals,customers,vehicles,activity_logs,report-revenue,report-vehicles,report-manager-performance,report-outstanding-payments,report-maintenance,report-customer-analysis'],
            'format' => ['nullable', 'string', 'in:xlsx,pdf'],
            'filters' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'An export type is required.',
            'type.in' => 'The export type must be one of: rentals, customers, vehicles, or a valid report type.',
            'format.in' => 'The export format must be either xlsx or pdf.',
        ];
    }
}
