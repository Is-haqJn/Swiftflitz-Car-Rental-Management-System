<?php

namespace App\Jobs;

use App\Events\NotificationCreatedEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\Broadcaster;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class BroadcastNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 1;

    /**
     * @param  array<string, mixed>  $notification
     */
    public function __construct(
        public readonly string $userId,
        public readonly array $notification,
    ) {
        $this->onQueue('default');
    }

    /**
     * Broadcast the notification directly via the Broadcaster contract.
     *
     * Using broadcast() on a ShouldBroadcast event queues a secondary BroadcastEvent
     * job - that job's failure cannot be caught here. Instead we invoke the broadcaster
     * synchronously inside this job so the try/catch actually handles Reverb outages.
     * Notifications are always persisted to DB before this job is dispatched, so
     * no data is lost when Reverb is unreachable.
     */
    public function handle(Broadcaster $broadcaster): void
    {
        try {
            $event = new NotificationCreatedEvent($this->userId, $this->notification);

            $broadcaster->broadcast(
                $event->broadcastOn(),
                $event->broadcastAs(),
                $event->broadcastWith(),
            );
        } catch (Throwable $e) {
            Log::warning('BroadcastNotificationJob: broadcast failed, skipping.', [
                'user_id' => $this->userId,
                'notification_id' => $this->notification['id'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
