<?php

namespace App\Services;

use App\DTOs\QuoteRequestData;
use App\Models\QuoteRequest;
use App\Services\Contracts\QuoteRequestServiceInterface;

class PublicBookingService
{
    public function __construct(
        protected QuoteRequestServiceInterface $quoteRequestService,
    ) {}

    /**
     * Create a public booking (quote request) from a simple payload.
     * Dispatches the QuoteRequestSubmitted event via the underlying service.
     */
    public function createBooking(array $data): QuoteRequest
    {
        $quoteData = QuoteRequestData::fromRequest($data);

        return $this->quoteRequestService->create($quoteData);
    }
}
