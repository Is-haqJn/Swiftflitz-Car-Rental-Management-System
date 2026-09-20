<?php

namespace App\Http\Requests;

use App\Enums\RentalStatus;
use App\Models\Rental;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->filled(['vehicle_id', 'pickup_date', 'return_date'])) {
                return;
            }

            $inactiveStatuses = [
                RentalStatus::Returned->value,
                RentalStatus::Completed->value,
                RentalStatus::Cancelled->value,
            ];

            $overlaps = Rental::where('vehicle_id', $this->vehicle_id)
                ->whereNotIn('status', $inactiveStatuses)
                ->where('pickup_date', '<=', $this->return_date)
                ->where('return_date', '>=', $this->pickup_date)
                ->exists();

            if ($overlaps) {
                $validator->errors()->add(
                    'pickup_date',
                    'The selected dates overlap an existing booking for this vehicle.'
                );
            }

            $this->validatePickupWindow($validator);
        });
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'customer_id' => ['required', 'uuid', 'exists:customers,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'pickup_date' => ['required', 'date'],
            'pickup_time' => ['nullable', 'string'],
            'return_date' => ['required', 'date', 'after:pickup_date'],
            'return_time' => ['nullable', 'string'],
            'source' => ['nullable', 'string', 'in:website,phone,walk_in,referral,quote_request'],
            'payment_method' => ['nullable', 'string', 'in:in_store,online'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'dropoff_location_id' => ['nullable', 'uuid', 'exists:rental_locations,id'],
            'addons' => ['nullable', 'array'],
            'addons.*.id' => ['required', 'uuid', 'exists:additional_charges,id'],
            'addons.*.quantity' => ['required', 'integer', 'min:1'],
            'coupon_code' => ['nullable', 'string'],
            'manual_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'manual_discount_reason' => ['nullable', 'string', 'max:255'],
            'skip_security_deposit' => ['nullable', 'boolean'],
            'young_driver_override' => ['nullable', 'boolean'],
            'initial_payment' => ['nullable', 'numeric', 'min:0'],
            'collect_deposit_now' => ['nullable', 'boolean'],
            'customer_notes' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string'],
        ];
    }

    private function validatePickupWindow(Validator $validator): void
    {
        $settings = app(RentalSettings::class);
        $windowStart = (int) explode(':', $settings->pickup_window_start)[0];
        $windowEnd = (int) explode(':', $settings->pickup_window_end)[0];

        if ($this->filled('pickup_time')) {
            $pickupHour = (int) explode(':', $this->pickup_time)[0];

            if ($pickupHour < $windowStart || $pickupHour > $windowEnd) {
                $validator->errors()->add(
                    'pickup_time',
                    "Pickup time must be between {$settings->pickup_window_start} and {$settings->pickup_window_end}."
                );
            }
        }

        if ($this->filled('return_time')) {
            $returnHour = (int) explode(':', $this->return_time)[0];

            if ($returnHour < $windowStart || $returnHour > $windowEnd) {
                $validator->errors()->add(
                    'return_time',
                    "Return time must be between {$settings->pickup_window_start} and {$settings->pickup_window_end}."
                );
            }
        }
    }
}
