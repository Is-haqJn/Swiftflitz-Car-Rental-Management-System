<?php

namespace App\Repositories;

use App\Models\QuoteRequest;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\QuoteRequestRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class QuoteRequestRepository extends QueryableRepository implements QuoteRequestRepositoryInterface
{
    public function query(): QueryBuilder
    {
        return parent::query()->defaultSort('-created_at');
    }

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->paginateFiltered($perPage);
    }

    public function findWithRelations(string $id): QuoteRequest
    {
        return QuoteRequest::with([
            'vehicle',
            'vehicle.category',
            'customer',
            'pickupLocation',
            'convertedRental',
            'conflictingCustomer',
        ])->findOrFail($id);
    }

    public function createQuote(array $data): QuoteRequest
    {
        return QuoteRequest::create($data);
    }

    public function updateQuote(QuoteRequest $quote, array $data): QuoteRequest
    {
        $quote->update($data);

        return $quote->refresh();
    }

    public function deleteQuote(QuoteRequest $quote): bool
    {
        return (bool) $quote->delete();
    }

    public function findByToken(string $token): ?QuoteRequest
    {
        return QuoteRequest::with([
            'vehicle',
            'vehicle.category',
            'pickupLocation',
        ])->where('quote_token', $token)->first();
    }

    public function findByReference(string $reference): ?QuoteRequest
    {
        return QuoteRequest::where('reference', $reference)->first();
    }

    public function generateReference(): string
    {
        $year = now()->year;
        do {
            $ref = 'QR-' . $year . '-' . strtoupper(Str::random(5));
        } while (QuoteRequest::where('reference', $ref)->exists());

        return $ref;
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('status'),
            AllowedFilter::exact('vehicle_id'),
            AllowedFilter::exact('branch_id'),
            AllowedFilter::exact('email'),
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('reference', 'like', "%{$value}%")
                        ->orWhere('name', 'like', "%{$value}%")
                        ->orWhere('email', 'like', "%{$value}%");
                });
            }),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'pickup_date', 'return_date', 'status'];
    }

    public function getDefaultIncludes(): array
    {
        return ['vehicle', 'vehicle.category', 'customer', 'pickupLocation', 'convertedRental'];
    }

    public function getAllowedIncludes(): array
    {
        return ['vehicle', 'vehicle.category', 'customer', 'pickupLocation', 'convertedRental'];
    }

    protected function model(): string
    {
        return QuoteRequest::class;
    }
}
