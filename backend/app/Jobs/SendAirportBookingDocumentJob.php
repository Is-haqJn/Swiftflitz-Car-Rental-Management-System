<?php

namespace App\Jobs;

use App\Mail\AirportBookingDocumentMail;
use App\Models\AirportBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendAirportBookingDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  string  $variant  'receipt' | 'invoice'
     * @param  string|null  $recipientFilter  'customer' | 'driver' | null (= both)
     */
    public function __construct(
        public readonly AirportBooking $booking,
        public readonly string $variant,
        public readonly ?string $recipientFilter = null,
    ) {
        $this->onQueue('email');
    }

    public function handle(): void
    {
        $booking = $this->booking->load(['airportCustomer', 'vehicle', 'driver', 'airport', 'package', 'terminalLocation', 'areaLocation']);

        $sendToCustomer = $this->recipientFilter === null || $this->recipientFilter === 'customer';
        $sendToDriver = $this->recipientFilter === null || $this->recipientFilter === 'driver';

        if ($sendToCustomer && $booking->airportCustomer?->email) {
            Mail::to($booking->airportCustomer->email)
                ->queue(new AirportBookingDocumentMail($booking, $this->variant, 'customer'));
        }

        if ($sendToDriver && $booking->driver?->email) {
            Mail::to($booking->driver->email)
                ->queue(new AirportBookingDocumentMail($booking, $this->variant, 'driver'));
        }
    }
}
