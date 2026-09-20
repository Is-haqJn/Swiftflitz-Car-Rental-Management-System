<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'type' => ['required', 'in:petty,maintenance'],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'expense_date' => ['nullable', 'date'],
            'receipts' => ['nullable', 'array', 'max:3'],
            'receipts.*' => ['file', 'mimes:jpeg,png,pdf', 'max:5120'],
            // receipt_tus_tokens: TUS upload keys for pre-uploaded files (alternative to receipts[])
            'receipt_tus_tokens' => ['nullable', 'array', 'max:3'],
            'receipt_tus_tokens.*' => ['nullable', 'string'],
        ];
    }
}
