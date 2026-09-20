<?php

namespace App\Repositories;

use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\Vehicle;
use App\Repositories\Contracts\TestNotificationRepositoryInterface;

class TestNotificationRepository implements TestNotificationRepositoryInterface
{
    /**
     * Get the most recent vehicle.
     */
    public function getLatestVehicle(): ?Vehicle
    {
        return Vehicle::query()->latest()->first();
    }

    /**
     * Get the most recent rental.
     */
    public function getLatestRental(): ?Rental
    {
        return Rental::query()->latest()->first();
    }

    /**
     * Get the most recent quote request.
     */
    public function getLatestQuoteRequest(): ?QuoteRequest
    {
        return QuoteRequest::query()->latest()->first();
    }
}
