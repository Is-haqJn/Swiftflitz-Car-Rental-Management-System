<?php

namespace App\Mail;

use App\Models\ChauffeurBooking;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ChauffeurRefundMail extends Mailable
{
    use SerializesModels;

    public string $queue = 'email';

    public function __construct(public readonly ChauffeurBooking $booking) {}

    public function build(): static
    {
        $data = $this->buildData();

        return $this
            ->subject("Refund Processed - {$this->booking->booking_reference}")
            ->view('emails.chauffeur-refund', $data);
    }

    private function buildData(): array
    {
        $booking = $this->booking;
        $customer = $booking->chauffeurCustomer;

        $amountPaid = (float) $booking->total_amount;
        $cancellationFee = $booking->cancellation_fee_applied !== null ? (float) $booking->cancellation_fee_applied : 0.0;
        $netRefund = max(0, $amountPaid - $cancellationFee);

        return [
            'customerName' => $customer?->full_name ?? 'Customer',
            'reference' => $booking->booking_reference,
            'pickupTime' => $booking->pickup_time?->format('D, M j, Y \a\t H:i'),
            'returnTime' => $booking->return_time?->format('D, M j, Y \a\t H:i'),
            'amountPaid' => $amountPaid,
            'cancellationFee' => $cancellationFee,
            'netRefund' => $netRefund,
            'refundNote' => $booking->refund_note,
            'currency_symbol' => $booking->currency_symbol ?? $booking->branch?->currency_symbol ?? config('swiftflitz.currency_symbol', '₵'),
        ];
    }
}
