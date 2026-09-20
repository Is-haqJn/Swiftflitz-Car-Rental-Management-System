<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAdditionalChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scope' => 'required|in:global,category,vehicle,regular',
            'category_id' => 'nullable|uuid|exists:categories,id|required_if:scope,category',
            'vehicle_id' => 'nullable|uuid|exists:vehicles,id|required_if:scope,vehicle',
            'charge_type' => 'required|in:flat,per_day',
            'amount' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_waivable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $this->safe()->all();

            // stock_quantity is only meaningful for regular scope
            if (isset($data['stock_quantity']) && ($data['scope'] ?? '') !== 'regular') {
                $validator->errors()->add(
                    'stock_quantity',
                    'Stock quantity is only allowed for charges with the regular scope.'
                );
            }

            /* Branch-restricted users (those assigned to at least one branch) must assign
               the charge to one of their own branches. Global users are unrestricted. */
            $user = $this->user();
            if ($user && $user->branches()->exists()) {
                if (empty($data['branch_id'])) {
                    $validator->errors()->add(
                        'branch_id',
                        'You must assign this charge to one of your branches.'
                    );
                } elseif (! $user->branches()->where('branches.id', $data['branch_id'])->exists()) {
                    $validator->errors()->add(
                        'branch_id',
                        'You do not have access to this branch.'
                    );
                }
            }
        });
    }
}
