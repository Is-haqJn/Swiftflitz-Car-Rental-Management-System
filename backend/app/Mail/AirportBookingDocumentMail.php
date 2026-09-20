<?php

namespace App\Mail;

use App\Models\AirportBooking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AirportBookingDocumentMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'high';

    public function __construct(public readonly AirportBooking $booking, public readonly string $variant, public readonly string $recipient) {}

    public function build(): static
    {
        $data = $this->buildDocumentData();
        $label = ucfirst($this->variant);
        $pdfBytes = Pdf::loadView('pdf.airport-booking-document', $data)->output();

        return $this
            ->subject("Airport Transfer {$label} - {$this->booking->booking_reference}")
            ->view('emails.airport-booking-document', $data)
            ->attachData($pdfBytes, "Airport-{$label}-{$this->booking->booking_reference}.pdf", [
                'mime' => 'application/pdf',
            ]);
    }

    private function buildDocumentData(): array
    {
        $booking = $this->booking;
        $customer = $booking->airportCustomer;
        $driver = $booking->driver;
        $vehicle = $booking->vehicle;
        $package = $booking->package;
        $airport = $booking->airport;
        $terminalLocation = $booking->terminalLocation;
        $areaLocation = $booking->areaLocation;

        return [
            'variant' => $this->variant,
            'recipient' => $this->recipient,
            'reference' => $booking->booking_reference,
            'issuedAt' => now()->format('D, M j, Y'),
            // Customer
            'customerName' => $customer?->full_name ?? $booking->passenger_name ?? 'Customer',
            'customerEmail' => $customer?->email,
            'customerPhone' => $customer?->phone ?? $booking->passenger_phone,
            // Passenger
            'passengerName' => $booking->passenger_name,
            'passengerPhone' => $booking->passenger_phone,
            'passengerCount' => $booking->passenger_count,
            'flightNumber' => $booking->flight_number,
            'airline' => $booking->airline,
            // Trip
            'direction' => $booking->direction?->value,
            'scheduledAt' => $booking->scheduled_at?->format('D, M j, Y \a\t H:i'),
            'airport' => $airport?->name,
            'terminal' => $terminalLocation?->name,
            'areaLocation' => $areaLocation?->name,
            'specificAddress' => $booking->specific_address,
            // Vehicle & driver
            'vehicleName' => $vehicle?->name ?? 'N/A',
            'packageName' => $package?->name ?? null,
            'driverName' => $driver?->name ?? null,
            'driverPhone' => $driver?->phone ?? null,
            // Pricing
            'packageRate' => (float) $booking->package_rate_snapshot,
            'areaCharge' => (float) $booking->area_charge_snapshot,
            'vatAmount' => $booking->vat_amount !== null ? (float) $booking->vat_amount : null,
            'totalAmount' => (float) $booking->total_amount,
            'paymentStatus' => $booking->payment_status->label(),
            'paymentMethod' => $booking->payment_method,
            'currency_symbol' => $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ];
    }
}
