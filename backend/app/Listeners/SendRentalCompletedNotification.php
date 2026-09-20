<?php

namespace App\Listeners;

use App\Events\RentalCompleted;
use App\Services\Contracts\NotificationServiceInterface;

class SendRentalCompletedNotification
{
    public function __construct(protected NotificationServiceInterface $notificationService) {}

    /**
     * Notify the manager when a rental has been fully completed.
     */
    public function handle(RentalCompleted $event): void
    {
        $rental = $event->rental->load(['customer', 'vehicle', 'manager']);

        if (! $rental->manager) {
            return;
        }

        $this->notificationService->send(
            $rental->manager->id,
            'rental_completed',
            'Rental Completed',
            "Booking {$rental->reference} for {$rental->customer->name} has been completed. Total: " . number_format($rental->total_cost, 2),
            ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
        );
    }
}
