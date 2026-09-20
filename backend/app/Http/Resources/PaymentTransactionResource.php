<?php

namespace App\Http\Resources;

use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'branch_id' => $this->branch_id,
            'provider' => $this->provider,
            'provider_reference' => $this->provider_reference,
            'channel' => $this->channel,
            'payment_phone' => $this->payment_phone,
            'card_bin' => $this->card_bin,
            'card_last4' => $this->card_last4,
            'card_type' => $this->card_type,
            'card_display' => ($this->card_bin && $this->card_last4)
                ? ($this->card_bin . '***' . $this->card_last4)
                : null,
            'type' => $this->type?->value,
            'type_label' => $this->type?->label(),
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'currency_symbol' => $this->currency_symbol,
            'exchange_rate' => $this->exchange_rate !== null ? (float) $this->exchange_rate : null,
            'gateway_amount' => $this->gateway_amount !== null ? (float) $this->gateway_amount : null,
            'gateway_currency' => $this->gateway_currency,
            'gateway_charges' => $this->gateway_charges !== null ? (float) $this->gateway_charges : null,
            'customer_amount' => $this->customer_amount !== null ? (float) $this->customer_amount : null,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'description' => $this->description,
            'discount_amount' => $this->discount_amount !== null ? (float) $this->discount_amount : null,
            'discount_reason' => $this->discount_reason,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'payer' => [
                'name' => $this->resolvePayerName(),
                'email' => $this->payer_email,
                'phone' => $this->payer_phone,
            ],

            'transactable' => $this->when(
                $this->transactable_type !== null,
                fn () => $this->resolveTransactableSummary()
            ),

            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ] : null),

            'processed_by' => $this->whenLoaded('processedBy', fn () => [
                'id' => $this->processedBy->id,
                'name' => $this->processedBy->name,
            ]),

            'coupon' => $this->whenLoaded('couponUsage', fn () => $this->couponUsage
                ? [
                    'coupon_usage_id' => $this->coupon_usage_id,
                    'code' => $this->couponUsage->coupon?->code,
                    'name' => $this->couponUsage->coupon?->name,
                ]
                : null
            ),

            'discount_rule' => $this->whenLoaded('discountRuleUsage', fn () => $this->discountRuleUsage
                ? [
                    'usage_id' => $this->discount_rule_usage_id,
                    'name' => $this->discountRuleUsage->discountRule?->name,
                ]
                : null
            ),
        ];
    }

    /**
     * Return the payer name, falling back to the transactable's customer when
     * the stored value is missing or was recorded as the legacy 'Unknown' sentinel.
     */
    private function resolvePayerName(): ?string
    {
        if ($this->payer_name && $this->payer_name !== 'Unknown') {
            return $this->payer_name;
        }

        if (! $this->relationLoaded('transactable') || ! $this->transactable) {
            return $this->payer_name;
        }

        $transactable = $this->transactable;

        $name = match (true) {
            $transactable instanceof Rental => $transactable->customer?->name,
            $transactable instanceof AirportBooking => $transactable->passenger_name ?? $transactable->airportCustomer?->name,
            $transactable instanceof ChauffeurBooking => $transactable->chauffeurCustomer?->name,
            default => null,
        };

        return $name ?? $this->payer_name;
    }

    /**
     * Resolve a compact summary of the related booking/rental.
     *
     * @return array<string, mixed>
     */
    private function resolveTransactableSummary(): array
    {
        $transactable = $this->transactable;
        $type = $this->transactable_type;

        if (! $transactable) {
            return [
                'type' => $type,
                'id' => $this->transactable_id,
                'reference' => null,
            ];
        }

        $reference = match (true) {
            $transactable instanceof Rental => $transactable->reference ?? $transactable->id,
            $transactable instanceof AirportBooking => $transactable->booking_reference ?? $transactable->id,
            $transactable instanceof ChauffeurBooking => $transactable->booking_reference ?? $transactable->id,
            default => $transactable->id,
        };

        return [
            'type' => $type,
            'id' => $transactable->id,
            'reference' => $reference,
        ];
    }
}
