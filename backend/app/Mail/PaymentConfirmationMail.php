<?php

namespace App\Mail;

use App\Enums\CustomerProfileStatus;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class PaymentConfirmationMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public string $customerName;

    public string $currencySymbol;

    /** @var array<string, mixed>|null */
    public ?array $bookingDetails;

    public bool $profileIncomplete;

    public ?string $profileCompleteUrl;

    public function __construct(public readonly PaymentTransaction $transaction)
    {
        $this->customerName = $this->resolveCustomerName($transaction);
        $this->currencySymbol = $this->resolveCurrencySymbol($transaction);
        $this->bookingDetails = $this->resolveBookingDetails($transaction);
        [$this->profileIncomplete, $this->profileCompleteUrl] = $this->resolveProfileStatus($transaction);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Payment Confirmed - {$this->transaction->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
            with: [
                'currency_symbol' => $this->currencySymbol,
            ],
        );
    }

    public function attachments(): array
    {
        if ($this->transaction->transactable_type === 'rental') {
            return $this->rentalReceiptAttachment();
        }

        if ($this->transaction->transactable_type !== 'chauffeur_booking') {
            return [];
        }

        $booking = ChauffeurBooking::with(['chauffeurCustomer', 'vehicle', 'driver', 'pickupLocation', 'branch'])
            ->find($this->transaction->transactable_id);

        if (! $booking) {
            return [];
        }

        $driver = $booking->driver;
        $vehicle = $booking->vehicle;
        $location = $booking->pickupLocation;
        $customer = $booking->chauffeurCustomer;

        $data = [
            'variant' => 'receipt',
            'recipient' => 'customer',
            'reference' => $booking->booking_reference,
            'issuedAt' => now()->format('D, M j, Y'),
            'customerName' => $customer?->full_name ?? 'Customer',
            'customerEmail' => $customer?->email,
            'customerPhone' => $customer?->phone,
            'expectedDestination' => $customer?->expected_destination,
            'vehicleName' => $vehicle?->name ?? 'N/A',
            'driverName' => $driver?->name ?? null,
            'driverPhone' => $driver?->phone ?? null,
            'pickupTime' => $booking->pickup_time?->format('D, M j, Y \a\t H:i'),
            'returnTime' => $booking->return_time?->format('D, M j, Y \a\t H:i'),
            'pickupLocation' => $location?->name,
            'basePrice' => (float) $booking->base_price_snapshot,
            'pickupCharge' => (float) $booking->pickup_charge_snapshot,
            'vatAmount' => $booking->vat_amount !== null ? (float) $booking->vat_amount : null,
            'overtimeHours' => (float) $booking->overtime_hours,
            'overtimeCharge' => (float) $booking->overtime_charge,
            'totalAmount' => (float) $booking->total_amount,
            'paymentStatus' => $booking->payment_status->label(),
            'paymentMethod' => $booking->payment_method,
            'currency_symbol' => $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ];

        $pdfBytes = Pdf::loadView('pdf.chauffeur-booking-document', $data)->output();

        return [
            Attachment::fromData(fn () => $pdfBytes, "Chauffeur-Receipt-{$booking->booking_reference}.pdf")
                ->withMime('application/pdf'),
        ];
    }

    /** @return array<int, Attachment> */
    private function rentalReceiptAttachment(): array
    {
        $rental = Rental::with([
            'customer', 'vehicle.branch', 'pickupLocation', 'dropoffLocation', 'branch',
        ])->find($this->transaction->transactable_id);

        if (! $rental) {
            return [];
        }

        try {
            $rawSym = $rental->currency_symbol ?? $rental->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵');
            /* DomPDF/DejaVu lacks glyphs for non-ASCII currency symbols (₵, ₦, etc.) */
            $sym = preg_match('/^[\x00-\x7F]+$/', $rawSym) ? $rawSym : ($rental->currency ?? 'GHS');

            $data = [
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
                'rentalDays' => $rental->rental_days,
                'dailyRate' => (float) $rental->daily_rate,
                'baseCost' => (float) $rental->base_cost,
                'addonCharges' => collect($rental->applied_charges_breakdown ?? [])
                    ->filter(fn ($c) => ($c['type'] ?? '') === 'addon')->values()->toArray(),
                'locationCharges' => collect($rental->applied_charges_breakdown ?? [])
                    ->filter(fn ($c) => ($c['type'] ?? '') === 'location')->values()->toArray(),
                'subtotal' => (float) $rental->subtotal,
                'discountAmount' => (float) $rental->total_discount_amount,
                'discountedSubtotal' => max(0.0, (float) $rental->subtotal - (float) $rental->total_discount_amount),
                'vatAmount' => $rental->vat_amount !== null ? (float) $rental->vat_amount : null,
                'totalCost' => (float) $rental->total_cost,
                'securityDepositAmount' => $rental->security_deposit_amount !== null ? (float) $rental->security_deposit_amount : null,
                'depositPaid' => (float) $rental->deposit_paid,
                'skipDeposit' => (bool) $rental->skip_security_deposit,
                'currency_symbol' => $sym,
                'issuedAt' => now()->format('D, M j, Y'),
            ];

            $pdfBytes = Pdf::loadView('pdf.booking-receipt', $data)->output();

            return [
                Attachment::fromData(fn () => $pdfBytes, "Booking-Receipt-{$rental->reference}.pdf")
                    ->withMime('application/pdf'),
            ];
        } catch (Throwable $e) {
            Log::warning('PaymentConfirmationMail: failed to generate rental receipt PDF', [
                'rental_id' => $rental->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * @return array{bool, string|null}
     */
    private function resolveProfileStatus(PaymentTransaction $transaction): array
    {
        if ($transaction->transactable_type !== 'rental') {
            return [false, null];
        }

        $rental = Rental::with('customer')->find($transaction->transactable_id);
        $customer = $rental?->customer;

        if (! $customer) {
            return [false, null];
        }

        $status = $customer->profile_status;
        $incomplete = $status === CustomerProfileStatus::Incomplete
            || $status === CustomerProfileStatus::Rejected;

        $profileCompleteUrl = null;

        if ($incomplete
            && $customer->reupload_token
            && $customer->reupload_token_expires_at
            && ! $customer->reupload_token_expires_at->isPast()
        ) {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $profileCompleteUrl = "{$frontendUrl}/complete-profile/{$customer->reupload_token}";
        }

        return [$incomplete, $profileCompleteUrl];
    }

    private function resolveCustomerName(PaymentTransaction $transaction): string
    {
        if ($transaction->payer_name) {
            return $transaction->payer_name;
        }

        $transactable = match ($transaction->transactable_type) {
            'rental' => Rental::with('customer')->find($transaction->transactable_id),
            'airport_booking' => AirportBooking::with('airportCustomer')->find($transaction->transactable_id),
            'chauffeur_booking' => ChauffeurBooking::with('chauffeurCustomer')->find($transaction->transactable_id),
            default => null,
        };

        return $transactable?->customer?->name
            ?? $transactable?->airportCustomer?->full_name
            ?? $transactable?->chauffeurCustomer?->full_name
            ?? 'Customer';
    }

    private function resolveCurrencySymbol(PaymentTransaction $transaction): string
    {
        $transactable = match ($transaction->transactable_type) {
            'rental' => Rental::with('branch')->find($transaction->transactable_id),
            'airport_booking' => AirportBooking::with('branch')->find($transaction->transactable_id),
            'chauffeur_booking' => ChauffeurBooking::with('branch')->find($transaction->transactable_id),
            default => null,
        };

        return $transactable?->currency_symbol
            ?? $transactable?->branch?->currency_symbol
            ?? config('swiftflitz.currency_symbol', '₵');
    }

    /**
     * Resolve a human-readable summary of the linked booking for the email body.
     *
     * @return array<string, mixed>|null
     */
    private function resolveBookingDetails(PaymentTransaction $transaction): ?array
    {
        if (! $transaction->transactable_type || ! $transaction->transactable_id) {
            return null;
        }

        return match ($transaction->transactable_type) {
            'rental' => $this->rentalDetails($transaction->transactable_id),
            'airport_booking' => $this->airportDetails($transaction->transactable_id),
            'chauffeur_booking' => $this->chauffeurDetails($transaction->transactable_id),
            default => null,
        };
    }

    /** @return array<string, mixed>|null */
    private function rentalDetails(string $id): ?array
    {
        $rental = Rental::with(['customer', 'vehicle'])->find($id);

        if (! $rental) {
            return null;
        }

        $sym = $rental->currency_symbol ?? $this->currencySymbol;

        return [
            'type' => 'Vehicle Rental',
            'reference' => $rental->reference,
            'rows' => array_filter([
                'Vehicle' => $rental->vehicle?->name,
                'Pickup Date' => $rental->start_date?->format('D, d M Y'),
                'Return Date' => $rental->end_date?->format('D, d M Y'),
                'Total Cost' => $sym . ' ' . number_format((float) $rental->total_cost, 2),
                'Amount Paid' => $sym . ' ' . number_format((float) $rental->amount_paid, 2),
                'Balance Due' => $sym . ' ' . number_format(max(0, (float) $rental->total_cost - (float) $rental->amount_paid), 2),
            ]),
        ];
    }

    /** @return array<string, mixed>|null */
    private function airportDetails(string $id): ?array
    {
        $booking = AirportBooking::with('branch')->find($id);

        if (! $booking) {
            return null;
        }

        $sym = $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? $this->currencySymbol;

        return [
            'type' => 'Airport Transfer',
            'reference' => $booking->booking_reference,
            'rows' => array_filter([
                'Passenger' => $booking->passenger_name,
                'From' => $booking->pickup_location,
                'To' => $booking->dropoff_location,
                'Pickup Date' => $booking->pickup_date?->format('D, d M Y g:i A'),
                'Total Amount' => $sym . ' ' . number_format((float) $booking->total_amount, 2),
            ]),
        ];
    }

    /** @return array<string, mixed>|null */
    private function chauffeurDetails(string $id): ?array
    {
        $booking = ChauffeurBooking::with('branch')->find($id);

        if (! $booking) {
            return null;
        }

        $sym = $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? $this->currencySymbol;

        return [
            'type' => 'Chauffeur Service',
            'reference' => $booking->booking_reference,
            'rows' => array_filter([
                'Pickup Location' => $booking->pickup_location,
                'Start Date' => $booking->start_date?->format('D, d M Y'),
                'End Date' => $booking->end_date?->format('D, d M Y'),
                'Total Amount' => $sym . ' ' . number_format((float) $booking->total_amount, 2),
            ]),
        ];
    }
}
