<?php

namespace App\Events;

use App\Http\Resources\RentalResource;
use App\Models\Rental;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RentalCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Rental $rental) {}

    /**
     * Broadcast on the per-rental channel and the admin dashboard channel.
     *
     * @return Channel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('rental.' . $this->rental->id),
            new PrivateChannel('dashboard'),
        ];
    }

    /** Client-side event name. */
    public function broadcastAs(): string
    {
        return 'RentalCompleted';
    }

    /**
     * Broadcast the rental payload via the API resource.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'rental' => (new RentalResource($this->rental->load(['vehicle', 'customer', 'manager'])))->resolve(),
        ];
    }
}
