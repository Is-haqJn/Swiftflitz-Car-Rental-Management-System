<?php

namespace App\Repositories\Contracts;

use App\Models\QuoteRequest;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface QuoteRequestRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(string $id): QuoteRequest;

    public function createQuote(array $data): QuoteRequest;

    public function updateQuote(QuoteRequest $quote, array $data): QuoteRequest;

    public function deleteQuote(QuoteRequest $quote): bool;

    public function findByToken(string $token): ?QuoteRequest;

    public function findByReference(string $reference): ?QuoteRequest;

    public function generateReference(): string;
}
