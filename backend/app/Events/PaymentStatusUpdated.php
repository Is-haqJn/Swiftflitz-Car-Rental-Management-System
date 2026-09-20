<?php

namespace App\Events;

use App\Models\PaymentTransaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly PaymentTransaction $transaction) {}

    /**
     * Broadcast on:
     * - A public channel keyed by reference (for the customer payment page)
     * - The private admin dashboard channel (so admin transaction lists auto-refresh)
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("payment.{$this->transaction->reference}"),
            new PrivateChannel('dashboard'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'reference' => $this->transaction->reference,
            'status' => $this->transaction->status->value,
            'provider' => $this->transaction->provider,
            'amount' => (float) $this->transaction->amount,
            'currency' => $this->transaction->currency,
        ];
    }
}
