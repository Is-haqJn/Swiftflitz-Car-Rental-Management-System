<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ChauffeurDriverAssignmentMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking) {}

    public function build(): static
    {
        $booking = $this->booking;
        $customer = $booking->chauffeurCustomer;

        return $this
            ->subject("New Chauffeur Assignment - {$booking->booking_reference}")
            ->view('emails.chauffeur-driver-assignment', [
                'reference' => $booking->booking_reference,
                'customerName' => $customer?->full_name ?? 'N/A',
                'customerEmail' => $customer?->email,
                'customerPhone' => $customer?->phone,
                'pickupTime' => $booking->pickup_time?->format('D, M j, Y \a\t H:i'),
                'returnTime' => $booking->return_time?->format('D, M j, Y \a\t H:i'),
                'pickupLocation' => $booking->pickupLocation?->name,
                'vehicleName' => $booking->vehicle?->name,
            ]);
    }
}
