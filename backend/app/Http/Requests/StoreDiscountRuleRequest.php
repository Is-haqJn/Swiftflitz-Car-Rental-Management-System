<?php

namespace App\Http\Requests;

use App\Enums\DiscountConditionType;
use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDiscountRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', Rule::enum(DiscountType::class)],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'condition_type' => ['required', Rule::enum(DiscountConditionType::class)],
            'condition_value' => ['nullable', 'string', 'max:255'],
            'is_stackable' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $type = $this->input('discount_type');
            $value = $this->input('discount_value');
            if ($type === DiscountType::Percentage->value && $value !== null && (float) $value > 100) {
                $v->errors()->add('discount_value', 'Percentage discount cannot exceed 100%.');
            }

            $conditionType = $this->input('condition_type');
            if ($conditionType && $conditionType !== DiscountConditionType::None->value && ! $this->filled('condition_value')) {
                $v->errors()->add('condition_value', 'A condition value is required for the selected condition type.');
            }

            $user = $this->user();
            if ($user && ! $user->hasAnyRole(['super_admin', 'admin']) && ! $this->filled('branch_id')) {
                $v->errors()->add('branch_id', 'Managers must assign a discount rule to one of their branches.');
            }
        });
    }
}
