<?php

namespace App\Services\Contracts;

use App\DTOs\QuoteRequestData;
use App\Models\QuoteRequest;
use App\Models\Rental;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface QuoteRequestServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findOrFail(string $id): QuoteRequest; // eager-loads all relations

    public function create(QuoteRequestData $data): QuoteRequest;

    public function markContacted(QuoteRequest $quote): QuoteRequest;

    public function generateQuote(QuoteRequest $quote, ?string $vehicleId, ?string $adminNotes, ?float $adminBasePrice = null): QuoteRequest;

    public function bookReturning(QuoteRequest $quote, ?string $altPhone = null): array;

    public function sendQuote(QuoteRequest $quote): QuoteRequest;

    public function getByToken(string $token): QuoteRequest;

    public function convertToRental(QuoteRequest $quote, array $payload): Rental;

    /** @return array{status: string, rental?: Rental, conflict_type?: string} */
    public function confirmByCustomer(QuoteRequest $quote, array $payload): array;

    /** @return array{status: string, rental?: Rental} */
    public function resolveConflict(QuoteRequest $quote, string $action): array;

    public function markConverted(QuoteRequest $quote, string $rentalId): QuoteRequest;

    public function cancel(QuoteRequest $quote): QuoteRequest;

    public function delete(QuoteRequest $quote): bool;
}
