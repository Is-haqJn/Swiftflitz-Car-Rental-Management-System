<?php

namespace App\Http\Requests;

use App\Enums\CouponBehaviourType;
use App\Enums\CouponScopeType;
use App\Enums\CouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDiscountCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['nullable', 'string', 'max:50', 'alpha_num', Rule::unique('discount_coupons', 'code')],
            'coupon_type' => ['required', 'string', Rule::in(CouponBehaviourType::list())],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'string', Rule::in(CouponType::list())],
            'value' => ['required', 'numeric', 'min:0'],
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
            if ($this->type === 'percentage' && $this->value > 100) {
                $validator->errors()->add('value', 'Percentage value cannot exceed 100.');
            }
        });
    }
}
