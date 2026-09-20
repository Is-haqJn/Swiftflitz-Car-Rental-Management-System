<?php

namespace App\Http\Requests;

use App\Enums\CouponBehaviourType;
use App\Enums\CouponScopeType;
use App\Enums\CouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateDiscountCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'coupon_type' => ['sometimes', 'string', Rule::in(CouponBehaviourType::list())],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['sometimes', 'string', Rule::in(CouponType::list())],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'valid_days' => ['nullable', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_customer' => ['nullable', 'integer', 'min:1'],
            'min_rental_days' => ['nullable', 'integer', 'min:1'],
            'min_rental_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'scopes' => ['sometimes', 'array'],
            'scopes.*.scope_type' => ['required', 'string', Rule::in(CouponScopeType::list())],
            'scopes.*.scope_id' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->type ?? $this->route('coupon')?->type?->value;
            if ($type === 'percentage' && $this->value !== null && $this->value > 100) {
                $validator->errors()->add('value', 'Percentage value cannot exceed 100.');
            }
        });
    }
}
