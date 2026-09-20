<?php

namespace App\Events;

use App\Http\Resources\ExportRecordResource;
use App\Models\ExportRecord;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExportReadyEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ExportRecord $exportRecord,
    ) {}

    /**
     * Broadcast on the user's private exports channel.
     *
     * @return Channel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('exports.' . $this->exportRecord->user_id),
        ];
    }

    /**
     * Name of the broadcast event on the frontend.
     */
    public function broadcastAs(): string
    {
        return 'ExportReady';
    }

    /**
     * Data to send to the frontend.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'export' => (new ExportRecordResource($this->exportRecord))->resolve(),
        ];
    }
}
