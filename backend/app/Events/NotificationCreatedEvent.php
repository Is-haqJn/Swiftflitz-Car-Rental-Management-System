<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreatedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $notification  The raw notification row data
     */
    public function __construct(
        private readonly string $userId,
        private readonly array $notification,
    ) {}

    /**
     * Broadcast on the user's private notifications channel.
     *
     * @return Channel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notifications.' . $this->userId),
        ];
    }

    /**
     * Name of the broadcast event on the frontend.
     */
    public function broadcastAs(): string
    {
        return 'NotificationCreated';
    }

    /**
     * Data to send to the frontend - matches AppNotificationResource shape.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->notification['id'],
                'type' => $this->notification['type'],
                'title' => $this->notification['title'],
                'message' => $this->notification['message'],
                'data' => is_string($this->notification['data'] ?? null)
                    ? json_decode($this->notification['data'], true)
                    : ($this->notification['data'] ?? null),
                'action_url' => $this->notification['action_url'] ?? null,
                'is_read' => false,
                'read_at' => null,
                'created_at' => $this->notification['created_at'],
            ],
        ];
    }
}
