<?php

namespace App\Mail;

use App\Models\AirportBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AirportDriverAssignmentMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly AirportBooking $booking) {}

    public function build(): static
    {
        $booking = $this->booking;
        $customer = $booking->airportCustomer;

        return $this
            ->subject("New Airport Transfer Assignment - {$booking->booking_reference}")
            ->view('emails.airport-driver-assignment', [
                'reference' => $booking->booking_reference,
                'customerName' => $customer?->full_name ?? $booking->passenger_name ?? 'N/A',
                'customerEmail' => $customer?->email,
                'customerPhone' => $customer?->phone ?? $booking->passenger_phone,
                'scheduledAt' => $booking->scheduled_at?->format('D, M j, Y \a\t H:i'),
                'direction' => $booking->direction?->value,
                'airport' => $booking->airport?->name,
                'terminal' => $booking->terminalLocation?->name,
                'areaLocation' => $booking->areaLocation?->name,
                'flightNumber' => $booking->flight_number,
                'vehicleName' => $booking->vehicle?->name,
            ]);
    }
}
