<?php

namespace App\Repositories\Contracts;

use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\Vehicle;

interface TestNotificationRepositoryInterface
{
    /**
     * Get the most recent vehicle.
     */
    public function getLatestVehicle(): ?Vehicle;

    /**
     * Get the most recent rental.
     */
    public function getLatestRental(): ?Rental;

    /**
     * Get the most recent quote request.
     */
    public function getLatestQuoteRequest(): ?QuoteRequest;
}
