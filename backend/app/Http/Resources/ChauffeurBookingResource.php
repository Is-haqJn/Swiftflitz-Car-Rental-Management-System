<?php

namespace App\Http\Resources;

use App\Enums\ChauffeurBookingStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChauffeurBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cancellableStatuses = [
            ChauffeurBookingStatus::Pending->value,
            ChauffeurBookingStatus::Confirmed->value,
            ChauffeurBookingStatus::DriverAssigned->value,
        ];

        return [
            'id' => $this->id,
            'booking_reference' => $this->booking_reference,
            'booking_status' => $this->booking_status?->value,
            'payment_status' => $this->payment_status?->value,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'pickup_time' => $this->pickup_time?->toISOString(),
            'return_time' => $this->return_time?->toISOString(),
            'actual_pickup_time' => $this->actual_pickup_time?->toISOString(),
            'actual_return_time' => $this->actual_return_time?->toISOString(),
            'base_price_snapshot' => (float) $this->base_price_snapshot,
            'pickup_charge_snapshot' => (float) $this->pickup_charge_snapshot,
            'vat_rate_snapshot' => (float) $this->vat_rate_snapshot,
            'vat_amount' => (float) $this->vat_amount,
            'coupon_discount_snapshot' => (float) $this->coupon_discount_snapshot,
            'overtime_hours' => (float) $this->overtime_hours,
            'overtime_charge' => (float) $this->overtime_charge,
            'total_amount' => (float) $this->total_amount,
            'cancellation_fee_applied' => $this->cancellation_fee_applied !== null ? (float) $this->cancellation_fee_applied : null,
            'no_show_fee_applied' => $this->no_show_fee_applied !== null ? (float) $this->no_show_fee_applied : null,
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'staff_notes' => $this->staff_notes,
            'refund_note' => $this->refund_note,
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
            'chauffeur_customer' => $this->whenLoaded('chauffeurCustomer', fn () => $this->chauffeurCustomer ? [
                'id' => $this->chauffeurCustomer->id,
                'full_name' => $this->chauffeurCustomer->full_name,
                'email' => $this->chauffeurCustomer->email,
                'phone' => $this->chauffeurCustomer->phone,
                'expected_destination' => $this->chauffeurCustomer->expected_destination,
            ] : null),
            'pickup_location' => $this->whenLoaded('pickupLocation', fn () => $this->pickupLocation ? [
                'id' => $this->pickupLocation->id,
                'name' => $this->pickupLocation->name,
                'charge' => $this->pickupLocation->charge !== null ? (float) $this->pickupLocation->charge : null,
            ] : null),
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
                'email' => $this->driver->email,
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
                'notes' => $r->notes,
                'performed_by' => $r->performedBy ? ['id' => $r->performedBy->id, 'name' => $r->performedBy->name] : null,
                'created_at' => $r->created_at?->toISOString(),
            ])),
            'pickup_log' => $this->whenLoaded('pickupLog', fn () => $this->pickupLog ? [
                'id' => $this->pickupLog->id,
                'confirmed_at' => $this->pickupLog->confirmed_at,
                'pickup_location' => $this->pickupLog->pickup_location,
                'odometer_reading' => $this->pickupLog->odometer_reading,
                'customer_present' => $this->pickupLog->customer_present,
                'driver_notes' => $this->pickupLog->driver_notes,
            ] : null),
            'return_log' => $this->whenLoaded('returnLog', fn () => $this->returnLog ? [
                'id' => $this->returnLog->id,
                'returned_at' => $this->returnLog->returned_at,
                'odometer_reading' => $this->returnLog->odometer_reading,
                'condition_notes' => $this->returnLog->condition_notes,
                'overtime_minutes' => $this->returnLog->overtime_minutes,
            ] : null),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
