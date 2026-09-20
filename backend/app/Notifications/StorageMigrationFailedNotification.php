<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StorageMigrationFailedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $target,
        public readonly int $total,
        public readonly int $failures
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
            ->subject('Storage Migration Failed')
            ->error()
            ->line("Storage migration to '{$this->target}' completed with {$this->failures} failure(s) out of {$this->total} file(s).")
            ->line('The storage_disk setting was NOT updated. Please check the application logs for details.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'target' => $this->target,
            'total' => $this->total,
            'failures' => $this->failures,
        ];
    }
}
