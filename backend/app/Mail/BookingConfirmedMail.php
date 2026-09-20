<?php

namespace App\Mail;

use App\Models\Rental;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingConfirmedMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly Rental $rental) {}

    public function build(): static
    {
        $data = $this->buildReceiptData();

        return $this
            ->subject("Your booking is confirmed - {$this->rental->reference}")
            ->view('emails.booking-confirmed', $data);
    }

    private function buildReceiptData(): array
    {
        $rental = $this->rental;

        return [
            'customerName' => $rental->customer?->name ?? 'there',
            'customerEmail' => $rental->customer?->email,
            'customerPhone' => $rental->customer?->phone,
            'reference' => $rental->reference,
            'vehicleName' => $rental->vehicle?->name ?? 'your selected vehicle',
            'pickupDate' => $rental->pickup_date?->format('D, M j, Y'),
            'returnDate' => $rental->return_date?->format('D, M j, Y'),
            'pickupTime' => $rental->pickup_time,
            'returnTime' => $rental->return_time,
            'pickupLocation' => $rental->pickupLocation?->name,
            'dropoffLocation' => $rental->dropoffLocation?->name,
            // Cost breakdown
            'rentalDays' => $rental->rental_days,
            'dailyRate' => (float) $rental->daily_rate,
            'baseCost' => (float) $rental->base_cost,
            'addonCharges' => collect($rental->applied_charges_breakdown ?? [])
                ->filter(fn ($c) => ($c['type'] ?? '') === 'addon')
                ->values()->toArray(),
            'locationCharges' => collect($rental->applied_charges_breakdown ?? [])
                ->filter(fn ($c) => ($c['type'] ?? '') === 'location')
                ->values()->toArray(),
            'subtotal' => (float) $rental->subtotal,
            'discountAmount' => (float) $rental->total_discount_amount,
            'discountedSubtotal' => max(0.0, (float) $rental->subtotal - (float) $rental->total_discount_amount),
            'vatAmount' => $rental->vat_amount !== null ? (float) $rental->vat_amount : null,
            'totalCost' => (float) $rental->total_cost,
            // Security deposit
            'securityDepositAmount' => $rental->security_deposit_amount !== null ? (float) $rental->security_deposit_amount : null,
            'depositPaid' => (float) $rental->deposit_paid,
            'skipDeposit' => (bool) $rental->skip_security_deposit,
            // Currency
            'currency_symbol' => $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
            // PDF metadata
            'issuedAt' => now()->format('D, M j, Y'),
        ];
    }
}
