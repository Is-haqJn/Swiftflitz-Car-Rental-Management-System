<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAdditionalChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'scope' => 'sometimes|required|in:global,category,vehicle,regular',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id',
            'charge_type' => 'sometimes|required|in:flat,per_day',
            'amount' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_waivable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $this->safe()->all();

            if (isset($data['stock_quantity'])) {
                // Use submitted scope or fall back to current model scope
                $scope = $data['scope'] ?? $this->route('additional_charge')?->scope?->value;
                if ($scope !== 'regular') {
                    $validator->errors()->add(
                        'stock_quantity',
                        'Stock quantity is only allowed for charges with the regular scope.'
                    );
                }
            }
        });
    }
}
