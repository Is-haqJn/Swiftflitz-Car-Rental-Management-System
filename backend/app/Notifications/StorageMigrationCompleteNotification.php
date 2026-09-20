<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StorageMigrationCompleteNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $target,
        public readonly int $total
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Storage Migration Completed')
            ->line("All {$this->total} media file(s) migrated to '{$this->target}' disk successfully.")
            ->line('The storage_disk setting has been updated.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'target' => $this->target,
            'total' => $this->total,
        ];
    }
}
