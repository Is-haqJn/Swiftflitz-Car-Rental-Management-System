<?php

namespace App\Http\Resources;

use App\Models\Rental;
use App\Settings\OverdueSettings;
use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class RentalResource extends JsonResource
{
    public function toArray($request): array
    {
        // Compute overdue breakdown once - reused for amount_due and the response field
        $overdueBreakdown = $this->computeOverdueBreakdown();

        // For live overdue (overdue_fee not yet baked), include estimated charge in amount_due
        $liveOverdueCharge = ($this->overdue_fee === null && $overdueBreakdown !== null)
            ? (float) $overdueBreakdown['charge']
            : 0.0;

        /*
         * Cancelled rentals owe cancellation_amount_owed (already accounts for days used,
         * cancellation fee, and what the customer paid). All other formulas do not apply.
         */
        $isCancelled = $this->status?->value === 'cancelled';

        $amountDue = $isCancelled
            ? max(0.0, round((float) ($this->cancellation_amount_owed ?? 0), 2))
            : round(
                max(0.0,
                    (float) $this->total_cost
                    + (float) ($this->overdue_fee ?? 0)
                    + $liveOverdueCharge
                    + (float) ($this->late_pickup_fee ?? 0)
                    + (float) ($this->early_return_charge ?? 0)
                    - (float) ($this->early_return_refund ?? 0)
                    - (float) $this->amount_paid
                    - (float) ($this->deposit_applied_to_balance ?? 0)
                ),
                2
            );

        return [
            // Identity
            'id' => $this->id,
            'reference' => $this->reference,

            // Ownership
            'branch_id' => $this->branch_id,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),
            'vehicle_id' => $this->vehicle_id,
            'vehicle' => $this->whenLoaded('vehicle', fn () => $this->vehicle ? [
                'id' => $this->vehicle->id,
                'name' => $this->vehicle->name,
                'license_plate' => $this->vehicle->license_plate,
                'daily_rate' => (float) $this->vehicle->daily_rate,
                'category' => $this->vehicle->relationLoaded('category') && $this->vehicle->category ? [
                    'id' => $this->vehicle->category->id,
                    'name' => $this->vehicle->category->name,
                ] : null,
            ] : null),
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone,
                'profile_status' => $this->customer->profile_status?->value,
                'address' => $this->customer->address,
                'license_number' => $this->customer->license_number,
                'license_expiry_date' => $this->customer->license_expiry_date?->format('Y-m-d'),
                'id_type' => $this->customer->id_type?->value,
                'id_number' => $this->customer->id_number,
                'id_expiry_date' => $this->customer->id_expiry_date?->format('Y-m-d'),
                'license_images' => $this->customer->getMedia('license')
                    ->map(fn ($m) => ['url' => $m->getUrl()])->values(),
                'id_document_images' => $this->customer->getMedia('id_document')
                    ->map(fn ($m) => ['url' => $m->getUrl()])->values(),
            ] : null),
            'manager_id' => $this->manager_id,
            'confirmed_by' => $this->confirmed_by,
            'source' => $this->source?->value,

            // Status
            'status' => $this->status?->value,
            'payment_status' => $this->payment_status?->value,

            // Scheduling
            'pickup_date' => $this->pickup_date?->format('Y-m-d'),
            'pickup_time' => $this->pickup_time,
            'return_date' => $this->return_date?->format('Y-m-d'),
            'return_time' => $this->return_time,
            'actual_pickup_date' => $this->actual_pickup_date?->toISOString(),
            'actual_return_date' => $this->actual_return_date?->toISOString(),

            // Location
            'pickup_location' => $this->pickup_location,
            'dropoff_location' => $this->dropoff_location,
            'pickup_location_id' => $this->pickup_location_id,
            'dropoff_location_id' => $this->dropoff_location_id,

            // Scheduling extras
            'extension_days' => $this->extension_days,
            'early_pickup_days' => $this->early_pickup_days,
            'original_return_date' => $this->original_return_date?->format('Y-m-d'),
            'max_extend_date' => $this->computeMaxExtendDate(),

            // Pricing snapshot
            'rental_days' => $this->rental_days,
            'daily_rate' => (float) $this->daily_rate,
            'base_cost' => (float) $this->base_cost,
            'extras_cost' => (float) $this->extras_cost,
            'additional_charges' => (float) $this->additional_charges,
            'location_charge' => (float) $this->location_charge,
            'subtotal' => (float) $this->subtotal,
            'vat_amount' => $this->vat_amount !== null ? (float) $this->vat_amount : null,
            'total_cost' => (float) $this->total_cost,
            'currency' => $this->currency ?? $this->branch?->currency,
            'currency_symbol' => $this->currency_symbol ?? $this->branch?->currency_symbol,
            'exchange_rate' => $this->exchange_rate !== null
                ? (float) $this->exchange_rate
                : ($this->branch?->exchange_rate !== null ? (float) $this->branch->exchange_rate : null),
            'total_cost_global' => $this->total_cost_global !== null ? (float) $this->total_cost_global : null,

            // Discounts
            'rule_discount_amount' => (float) $this->rule_discount_amount,
            'coupon_discount_amount' => (float) $this->coupon_discount_amount,
            'manual_discount_amount' => (float) $this->manual_discount_amount,
            'manual_discount_reason' => $this->manual_discount_reason,
            'total_discount_amount' => (float) $this->total_discount_amount,
            'coupon_applied' => $this->coupon_applied,
            'applied_charges_breakdown' => $this->applied_charges_breakdown,

            // Payment
            'amount_paid' => (float) $this->amount_paid,
            'amount_due' => $amountDue,

            // Security deposit
            'security_deposit_amount' => $this->security_deposit_amount !== null ? (float) $this->security_deposit_amount : null,
            'security_deposit_status' => $this->security_deposit_status,
            'skip_security_deposit' => $this->skip_security_deposit,
            'deposit_paid' => (float) $this->deposit_paid,
            'deposit_refunded' => (float) $this->deposit_refunded,
            'deposit_applied_to_balance' => (float) ($this->deposit_applied_to_balance ?? 0),
            'deposit_refunded_at' => $this->deposit_refunded_at?->toISOString(),
            'deposit_waived' => $this->deposit_waived,
            'deposit_waiver_reason' => $this->deposit_waiver_reason,

            // Fees
            'overdue_fee' => $this->overdue_fee !== null ? (float) $this->overdue_fee : null,
            'late_pickup_fee' => $this->late_pickup_fee !== null ? (float) $this->late_pickup_fee : null,
            'vehicle_switch_fee' => $this->vehicle_switch_fee !== null ? (float) $this->vehicle_switch_fee : null,

            // Overdue
            'is_overdue' => $this->is_overdue,
            'overdue_minutes' => $this->overdue_minutes,
            'overdue_waived' => $this->overdue_waived,
            'overdue_waiver_reason' => $this->overdue_waiver_reason,
            'overdue_breakdown' => $overdueBreakdown,

            // Early return
            'is_early_return' => $this->is_early_return,
            'actual_rental_days' => $this->actual_rental_days,
            'early_return_refund' => $this->early_return_refund !== null ? (float) $this->early_return_refund : null,
            'early_return_charge' => $this->early_return_charge !== null ? (float) $this->early_return_charge : null,
            'early_return_charge_waived' => $this->early_return_charge_waived,
            'early_return_charge_waived_by' => $this->early_return_charge_waived_by,
            'early_return_charge_waiver_reason' => $this->early_return_charge_waiver_reason,
            'early_return_reason' => $this->early_return_reason,

            // Settlement
            'settlement_status' => $this->settlement_status,
            'damage_settlement_status' => $this->damage_settlement_status,

            // Damage
            'has_damage' => $this->has_damage,
            'estimated_repair_cost' => $this->estimated_repair_cost !== null ? (float) $this->estimated_repair_cost : null,
            'actual_repair_cost' => $this->actual_repair_cost !== null ? (float) $this->actual_repair_cost : null,
            'damage_balance_due' => $this->damage_balance_due !== null ? (float) $this->damage_balance_due : null,

            // Notes
            'customer_notes' => $this->customer_notes,
            'admin_notes' => $this->admin_notes,

            // Cancellation
            'cancellation_reason' => $this->cancellation_reason,
            'cancellation_fee' => $this->cancellation_fee !== null ? (float) $this->cancellation_fee : null,
            'days_used_cost' => $this->days_used_cost !== null ? (float) $this->days_used_cost : null,
            'refund_amount' => $this->refund_amount !== null ? (float) $this->refund_amount : null,
            'refund_status' => $this->refund_status,
            'cancellation_amount_owed' => $this->cancellation_amount_owed !== null ? (float) $this->cancellation_amount_owed : null,
            'cancellation_debt_waived' => (bool) $this->cancellation_debt_waived,
            'cancellation_deposit_deduction' => $this->cancellation_deposit_deduction !== null ? (float) $this->cancellation_deposit_deduction : null,
            'cancellation_debt_paid' => $this->cancellation_debt_paid !== null ? (float) $this->cancellation_debt_paid : null,
            'cancelled_by_type' => $this->cancelled_by_type,
            'cancelled_at' => $this->cancelled_at?->toISOString(),

            // Video evidence
            'pickup_videos' => $this->mapVideoMedia('pickup_video'),
            'return_videos' => $this->mapVideoMedia('return_video'),

            // Relationships
            'inspections' => $this->whenLoaded(
                'inspections',
                fn () => RentalInspectionResource::collection($this->inspections)
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function mapVideoMedia(string $collection): ?array
    {
        $items = $this->getMedia($collection);

        if ($items->isEmpty()) {
            return null;
        }

        return $items->map(function ($m) {
            $streamUrl = URL::temporarySignedRoute(
                'api.v1.rentals.videos.stream',
                now()->addHour(),
                ['rental' => $this->id, 'media' => $m->id]
            );

            return [
                'id' => $m->id,
                'url' => $m->getFullUrl(),
                'stream_url' => $streamUrl,
                'thumbnail_url' => $m->getCustomProperty('thumbnail_url'),
                'mime_type' => $m->mime_type,
                'video_deleted' => (bool) $m->getCustomProperty('video_deleted', false),
            ];
        })->values()->toArray();
    }

    private function computeMaxExtendDate(): ?string
    {
        $nextPickup = Rental::where('vehicle_id', $this->vehicle_id)
            ->where('id', '!=', $this->id)
            ->whereIn('status', ['pending', 'confirmed', 'active', 'overdue'])
            ->where('pickup_date', '>', $this->return_date)
            ->orderBy('pickup_date')
            ->value('pickup_date');

        if (! $nextPickup) {
            return null;
        }

        return Carbon::parse($nextPickup)->subDay()->format('Y-m-d');
    }

    private function computeOverdueBreakdown(): ?array
    {
        $isLiveOverdue = ($this->status?->value ?? $this->status) === 'overdue'
            && $this->actual_return_date === null;
        $isPostReturnOverdue = $this->is_overdue && $this->overdue_minutes !== null;

        if (! $isLiveOverdue && ! $isPostReturnOverdue) {
            return null;
        }

        $settings = app(OverdueSettings::class);

        if ($isPostReturnOverdue) {
            $minutes = (int) $this->overdue_minutes;
        } else {
            // Live: compute from scheduled return vs now
            $scheduledReturn = $this->scheduled_return_date;
            $overdueStart = $settings->overdue_start_type === 'grace_period'
                ? $scheduledReturn->copy()->addMinutes($settings->grace_period_minutes)
                : $scheduledReturn->copy();
            $minutes = max(0, (int) $overdueStart->diffInMinutes(Carbon::now(), false));

            if ($minutes <= 0) {
                return null;
            }
        }

        $thresholdMins = $settings->overdue_threshold_hours * 60;
        $vehicle = $this->vehicle;

        if ($vehicle) {
            $vehicle->loadMissing('category');
        }

        $perDayAddonsCharge = 0.0;
        $perDayAddonsRate = 0.0;

        if ($minutes <= $thresholdMins) {
            $rate = (float) ($vehicle?->overdue_daily_rate
                ?? $vehicle?->category?->overdue_daily_rate
                ?? $settings->overdue_hourly_rate);
            $units = (int) ceil($minutes / 60);
            $type = 'hourly';
        } else {
            $rate = (float) $this->daily_rate;
            $units = (int) ceil($minutes / 1440);
            $type = 'daily';

            // Per-day add-ons apply for daily overdue - full day assumed used
            foreach ($this->applied_charges_breakdown ?? [] as $item) {
                if (($item['type'] ?? '') === 'addon' && ($item['is_per_day'] ?? false) && isset($item['unit_rate'])) {
                    $perDayAddonsRate += (float) $item['unit_rate'];
                }
            }
            $perDayAddonsCharge = round($perDayAddonsRate * $units, 2);
        }

        return [
            'minutes' => $minutes,
            'type' => $type,
            'units' => $units,
            'rate' => $rate,
            'charge' => round($rate * $units, 2),  // vehicle rate only - frontend computes addon split
            'per_day_addons_charge' => $perDayAddonsCharge,
            'per_day_addons_rate' => $perDayAddonsRate,
        ];
    }
}
