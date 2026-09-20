<?php

namespace App\Events;

use App\Http\Resources\Rentals\QuoteRequestResource;
use App\Models\QuoteRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuoteRequestSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly QuoteRequest $quoteRequest) {}

    /**
     * Broadcast on the admin dashboard channel.
     *
     * @return Channel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('dashboard'),
        ];
    }

    /** Client-side event name. */
    public function broadcastAs(): string
    {
        return 'QuoteRequestSubmitted';
    }

    /**
     * Broadcast the quote request payload via the API resource.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'quote_request' => (new QuoteRequestResource($this->quoteRequest->load(['vehicle', 'customer'])))->resolve(),
        ];
    }
}
