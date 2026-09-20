<?php

namespace App\Http\Requests;

use App\Settings\ChauffeurSettings;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class StoreChauffeurBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'vehicle_id' => ['required', 'uuid', 'exists:fleet_vehicles,id'],
            'driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
            'pickup_location_id' => ['nullable', 'uuid', 'exists:chauffeur_locations,id'],
            'pickup_time' => ['required', 'date'],
            'return_time' => ['nullable', 'date'],
            'customer_full_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'expected_destination' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'staff_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $pickupTime = $this->input('pickup_time');
            if (! $pickupTime) {
                return;
            }

            $settings = app(ChauffeurSettings::class);
            $pickupHour = Carbon::parse($pickupTime)->hour;
            $windowStart = (int) Carbon::parse($settings->booking_window_start)->format('H');
            $windowEnd = (int) Carbon::parse($settings->booking_window_end)->format('H');

            if ($pickupHour < $windowStart) {
                $validator->errors()->add(
                    'pickup_time',
                    "Pickup time must be at or after {$settings->booking_window_start}."
                );
            }

            if ($pickupHour > $windowEnd) {
                $validator->errors()->add(
                    'pickup_time',
                    "Pickup time must be at or before {$settings->booking_window_end}."
                );
            }

            // Vehicle overlap check
            $vehicleId = $this->input('vehicle_id');
            if (! $vehicleId || $validator->errors()->has('vehicle_id') || $validator->errors()->has('pickup_time')) {
                return;
            }

            $pickup = Carbon::parse($pickupTime);
            $returnTime = $this->input('return_time')
                ? Carbon::parse($this->input('return_time'))
                : $pickup->copy()->setTimeFromTimeString($settings->standard_return_time);

            $conflict = DB::table('chauffeur_bookings')
                ->whereNull('deleted_at')
                ->where('vehicle_id', $vehicleId)
                ->whereNotIn('booking_status', ['completed', 'cancelled', 'no_show'])
                ->where('pickup_time', '<', $returnTime->toDateTimeString())
                ->where('return_time', '>', $pickup->toDateTimeString())
                ->exists();

            if ($conflict) {
                $validator->errors()->add(
                    'vehicle_id',
                    'This vehicle already has a booking during the selected time.'
                );
            }
        });
    }
}
