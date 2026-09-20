<?php

namespace App\Listeners;

use App\Events\RentalReturned;
use App\Services\Contracts\NotificationServiceInterface;

class SendRentalReturnedNotification
{
    public function __construct(protected NotificationServiceInterface $notificationService) {}

    /**
     * Notify the manager when a rental vehicle has been returned.
     */
    public function handle(RentalReturned $event): void
    {
        $rental = $event->rental->load(['customer', 'vehicle', 'manager']);

        if (! $rental->manager) {
            return;
        }

        $vehicleName = $rental->vehicle->name ?? 'the vehicle';

        $this->notificationService->send(
            $rental->manager->id,
            'rental_returned',
            'Vehicle Returned',
            "{$rental->customer->name} has returned {$vehicleName} for booking {$rental->reference}.",
            ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
        );
    }
}
