<?php

namespace App\Http\Resources;

use App\Enums\AirportBookingStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AirportBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cancellableStatuses = [
            AirportBookingStatus::Pending->value,
            AirportBookingStatus::PaymentReceived->value,
            AirportBookingStatus::Confirmed->value,
        ];

        return [
            'id' => $this->id,
            'booking_reference' => $this->booking_reference,
            'direction' => $this->direction?->value,
            'booking_status' => $this->booking_status?->value,
            'payment_status' => $this->payment_status?->value,
            'booking_source' => $this->booking_source?->value,
            'assignment_mode' => $this->assignment_mode?->value,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'passenger_name' => $this->passenger_name,
            'passenger_phone' => $this->passenger_phone,
            'passenger_count' => $this->passenger_count,
            'flight_number' => $this->flight_number,
            'airline' => $this->airline,
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'specific_address' => $this->specific_address,
            'staff_notes' => $this->staff_notes,
            'package_rate_snapshot' => (float) $this->package_rate_snapshot,
            'area_charge_snapshot' => (float) $this->area_charge_snapshot,
            'vat_rate_snapshot' => (float) $this->vat_rate_snapshot,
            'vat_amount' => (float) $this->vat_amount,
            'coupon_discount_snapshot' => (float) $this->coupon_discount_snapshot,
            'total_amount' => (float) $this->total_amount,
            'cancellation_fee_applied' => $this->cancellation_fee_applied !== null ? (float) $this->cancellation_fee_applied : null,
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'is_cancellable' => in_array($this->booking_status?->value, $cancellableStatuses),
            'branch_id' => $this->branch_id,
            'currency' => $this->currency ?? $this->branch?->currency,
            'currency_symbol' => $this->currency_symbol
                ?? ($this->branch?->exchange_rate !== null ? $this->branch->currency_symbol : null),
            'exchange_rate' => $this->exchange_rate !== null
                ? (float) $this->exchange_rate
                : ($this->branch?->exchange_rate !== null ? (float) $this->branch->exchange_rate : null),

            // Relationships
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ]),
            'airport' => $this->whenLoaded('airport', fn () => [
                'id' => $this->airport->id,
                'name' => $this->airport->name,
                'city' => $this->airport->city,
            ]),
            'package' => $this->whenLoaded('package', fn () => [
                'id' => $this->package->id,
                'name' => $this->package->name,
                'features' => $this->package->features,
            ]),
            'airport_customer' => $this->whenLoaded('airportCustomer', fn () => new AirportCustomerResource($this->airportCustomer)),
            'terminal_location' => $this->whenLoaded('terminalLocation', fn () => [
                'id' => $this->terminalLocation->id,
                'name' => $this->terminalLocation->name,
                'location_type' => $this->terminalLocation->location_type?->value,
            ]),
            'area_location' => $this->whenLoaded('areaLocation', fn () => [
                'id' => $this->areaLocation->id,
                'name' => $this->areaLocation->name,
                'has_charge' => $this->areaLocation->has_charge,
                'charge_amount' => (float) ($this->areaLocation->charge_amount ?? 0),
            ]),
            'vehicle' => $this->whenLoaded('vehicle', fn () => $this->vehicle ? [
                'id' => $this->vehicle->id,
                'make' => $this->vehicle->make,
                'model' => $this->vehicle->model,
                'license_plate' => $this->vehicle->license_plate,
                'color' => $this->vehicle->color,
            ] : null),
            'driver' => $this->whenLoaded('driver', fn () => $this->driver ? [
                'id' => $this->driver->id,
                'name' => $this->driver->full_name,
                'phone' => $this->driver->phone_number,
            ] : null),
            'created_by' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ] : null),
            'cancelled_by' => $this->whenLoaded('cancelledBy', fn () => $this->cancelledBy ? [
                'id' => $this->cancelledBy->id,
                'name' => $this->cancelledBy->name,
            ] : null),

            'booking_records' => $this->whenLoaded('bookingRecords', fn () => $this->bookingRecords->map(fn ($r) => [
                'id' => $r->id,
                'action' => $r->action,
                'performed_by' => $r->performedBy ? ['id' => $r->performedBy->id, 'name' => $r->performedBy->name] : null,
                'created_at' => $r->created_at?->toISOString(),
            ])),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
