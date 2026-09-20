<?php

namespace App\Jobs;

use App\Mail\ChauffeurBookingDocumentMail;
use App\Models\ChauffeurBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendChauffeurBookingDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  string  $variant  'receipt' | 'invoice'
     * @param  string|null  $recipientFilter  'customer' | 'driver' | null (= both)
     */
    public function __construct(
        public readonly ChauffeurBooking $booking,
        public readonly string $variant,
        public readonly ?string $recipientFilter = null,
    ) {
        $this->onQueue('email');
    }

    public function handle(): void
    {
        $booking = $this->booking->load(['chauffeurCustomer', 'vehicle', 'driver', 'pickupLocation', 'branch']);

        $sendToCustomer = $this->recipientFilter === null || $this->recipientFilter === 'customer';
        $sendToDriver = $this->recipientFilter === null || $this->recipientFilter === 'driver';

        if ($sendToCustomer && $booking->chauffeurCustomer?->email) {
            Mail::to($booking->chauffeurCustomer->email)
                ->queue(new ChauffeurBookingDocumentMail($booking, $this->variant, 'customer'));
        }

        if ($sendToDriver && $booking->driver?->email) {
            Mail::to($booking->driver->email)
                ->queue(new ChauffeurBookingDocumentMail($booking, $this->variant, 'driver'));
        }
    }
}
