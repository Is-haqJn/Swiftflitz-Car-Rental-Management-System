<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VehicleListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:100'],
            'category_id' => ['sometimes', 'string', 'exists:categories,id'],
            'status' => ['sometimes', 'string', 'in:available,rented,maintenance,retired,pending_approval,unavailable'],
            'fuel_type' => ['sometimes', 'string', 'in:petrol,diesel,electric,hybrid'],
            'transmission' => ['sometimes', 'string', 'in:automatic,manual'],
            'color' => ['sometimes', 'string', 'max:50'],
            'seats' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0', 'gte:min_price'],
            'min_year' => ['sometimes', 'integer', 'min:1900', 'max:2030'],
            'max_year' => ['sometimes', 'integer', 'min:1900', 'max:2030', 'gte:min_year'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_by' => ['sometimes', 'string', 'in:name,make,model,year,daily_rate,odometer,created_at'],
            'sort_order' => ['sometimes', 'string', 'in:asc,desc'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function filters(): array
    {
        return $this->validated();
    }

    public function perPage(): int
    {
        return (int) $this->validated('per_page', 15);
    }
}
