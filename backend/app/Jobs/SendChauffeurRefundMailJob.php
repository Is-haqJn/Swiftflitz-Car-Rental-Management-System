<?php

namespace App\Jobs;

use App\Mail\ChauffeurRefundMail;
use App\Models\ChauffeurBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendChauffeurRefundMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly ChauffeurBooking $booking)
    {
        $this->onQueue('email');
    }

    public function handle(): void
    {
        $booking = $this->booking->load(['chauffeurCustomer']);

        if ($booking->chauffeurCustomer?->email) {
            Mail::to($booking->chauffeurCustomer->email)
                ->queue(new ChauffeurRefundMail($booking));
        }
    }
}
