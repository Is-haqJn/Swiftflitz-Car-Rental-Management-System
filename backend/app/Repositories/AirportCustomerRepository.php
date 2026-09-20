<?php

namespace App\Repositories;

use App\Models\AirportCustomer;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\AirportCustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\QueryBuilder;

class AirportCustomerRepository extends QueryableRepository implements AirportCustomerRepositoryInterface
{
    public function query(): QueryBuilder
    {
        return parent::query()->defaultSort('-created_at');
    }

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->paginateFiltered($perPage);
    }

    public function findCustomer(string $id): AirportCustomer
    {
        return AirportCustomer::with('bookings')->findOrFail($id);
    }

    public function findByEmail(string $email): ?AirportCustomer
    {
        return AirportCustomer::where('email', $email)->first();
    }

    public function createCustomer(array $data): AirportCustomer
    {
        return AirportCustomer::create($data);
    }

    public function updateCustomer(string $id, array $data): AirportCustomer
    {
        $customer = AirportCustomer::findOrFail($id);
        $customer->update($data);

        return $customer->fresh();
    }

    public function deleteCustomer(string $id): bool
    {
        return (bool) AirportCustomer::findOrFail($id)->delete();
    }

    public function getAllowedFilters(): array
    {
        return [
            'full_name',
            'email',
            'phone',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'full_name'];
    }

    protected function model(): string
    {
        return AirportCustomer::class;
    }
}
