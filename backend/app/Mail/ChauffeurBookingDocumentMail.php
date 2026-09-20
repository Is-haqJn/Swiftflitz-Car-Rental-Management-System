<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ChauffeurBookingDocumentMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'high';

    public function __construct(public readonly ChauffeurBooking $booking, public readonly string $variant, public readonly string $recipient) {}

    public function build(): static
    {
        $data = $this->buildDocumentData();
        $label = ucfirst($this->variant);
        $pdfBytes = Pdf::loadView('pdf.chauffeur-booking-document', $data)->output();

        return $this
            ->subject("Chauffeur Booking {$label} - {$this->booking->booking_reference}")
            ->view('emails.chauffeur-booking-document', $data)
            ->attachData($pdfBytes, "Chauffeur-{$label}-{$this->booking->booking_reference}.pdf", [
                'mime' => 'application/pdf',
            ]);
    }

    private function buildDocumentData(): array
    {
        $booking = $this->booking;
        $customer = $booking->chauffeurCustomer;
        $driver = $booking->driver;
        $vehicle = $booking->vehicle;
        $location = $booking->pickupLocation;

        return [
            'variant' => $this->variant,
            'recipient' => $this->recipient,
            'reference' => $booking->booking_reference,
            'issuedAt' => now()->format('D, M j, Y'),
            // Customer
            'customerName' => $customer?->full_name ?? 'Customer',
            'customerEmail' => $customer?->email,
            'customerPhone' => $customer?->phone,
            'expectedDestination' => $customer?->expected_destination,
            // Vehicle
            'vehicleName' => $vehicle?->name ?? 'N/A',
            // Driver
            'driverName' => $driver?->name ?? null,
            'driverPhone' => $driver?->phone ?? null,
            // Schedule
            'pickupTime' => $booking->pickup_time?->format('D, M j, Y \a\t H:i'),
            'returnTime' => $booking->return_time?->format('D, M j, Y \a\t H:i'),
            'pickupLocation' => $location?->name,
            // Pricing
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
    }
}
