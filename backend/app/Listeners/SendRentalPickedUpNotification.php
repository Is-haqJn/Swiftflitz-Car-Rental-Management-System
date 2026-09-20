<?php

namespace App\Listeners;

use App\Events\RentalPickedUp;
use App\Services\Contracts\NotificationServiceInterface;

class SendRentalPickedUpNotification
{
    public function __construct(protected NotificationServiceInterface $notificationService) {}

    /**
     * Notify the manager when a rental vehicle has been picked up.
     */
    public function handle(RentalPickedUp $event): void
    {
        $rental = $event->rental->load(['customer', 'vehicle', 'manager']);

        if (! $rental->manager) {
            return;
        }

        $vehicleName = $rental->vehicle->name ?? 'the vehicle';

        $this->notificationService->send(
            $rental->manager->id,
            'rental_picked_up',
            'Vehicle Picked Up',
            "{$rental->customer->name} has picked up {$vehicleName} for booking {$rental->reference}.",
            ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
        );
    }
}
