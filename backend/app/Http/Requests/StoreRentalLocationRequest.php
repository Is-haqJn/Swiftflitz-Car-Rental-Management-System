<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRentalLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => 'required|uuid|exists:branches,id',
            'name' => 'required|string|max:255',
            'pickup_charge' => 'nullable|numeric|min:0',
            'dropoff_charge' => 'nullable|numeric|min:0',
            'is_default' => 'boolean',
            'is_pickup' => 'boolean',
            'is_dropoff' => 'boolean',
            'is_chauffeur' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();

            /* Branch-restricted users (those assigned to at least one branch) may only
               create locations within their own branches. Global users are unrestricted. */
            if ($user && $user->branches()->exists()) {
                $userBranchIds = $user->branches()->pluck('id')->toArray();
                if (! in_array($this->branch_id, $userBranchIds)) {
                    $validator->errors()->add('branch_id', 'You do not have access to this branch.');
                }
            }
        });
    }
}
