<?php

namespace App\Http\Requests;

use App\Enums\RentalStatus;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(Validator $validator): void
    {
        if ($this->areDatesLocked()) {
            return;
        }

        $validator->after(function (Validator $validator) {
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
        });
    }

    public function rules(): array
    {
        $datesLocked = $this->areDatesLocked();
        $pickupLocationLocked = $this->isPickupLocationLocked();

        return [
            'vehicle_id' => ['prohibited'],
            'customer_id' => ['prohibited'],
            'pickup_date' => $datesLocked ? ['prohibited'] : ['sometimes', 'date'],
            'pickup_time' => $datesLocked ? ['prohibited'] : ['sometimes', 'nullable', 'string'],
            'return_date' => $datesLocked ? ['prohibited'] : ['sometimes', 'date'],
            'return_time' => $datesLocked ? ['prohibited'] : ['sometimes', 'nullable', 'string'],
            'source' => ['sometimes', 'string', 'in:website,phone,walk_in,referral,quote_request'],
            'pickup_location_id' => $pickupLocationLocked ? ['prohibited'] : ['sometimes', 'nullable', 'uuid', 'exists:rental_locations,id'],
            'dropoff_location_id' => $pickupLocationLocked ? ['prohibited'] : ['sometimes', 'nullable', 'uuid', 'exists:rental_locations,id'],
            'customer_notes' => ['sometimes', 'nullable', 'string'],
            'admin_notes' => ['sometimes', 'nullable', 'string'],
        ];
    }

    private function areDatesLocked(): bool
    {
        $rental = $this->route('rental');
        $lockedStatuses = [RentalStatus::Confirmed, RentalStatus::Active, RentalStatus::Overdue, RentalStatus::Returned, RentalStatus::Completed];

        return $rental !== null && in_array($rental->status, $lockedStatuses, true);
    }

    private function isPickupLocationLocked(): bool
    {
        $rental = $this->route('rental');
        $lockedStatuses = [RentalStatus::Active, RentalStatus::Overdue, RentalStatus::Returned, RentalStatus::Completed];

        return $rental !== null && in_array($rental->status, $lockedStatuses, true);
    }
}
