<?php

namespace App\Repositories\Contracts;

use App\Models\AirportCustomer;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AirportCustomerRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findCustomer(string $id): AirportCustomer;

    public function findByEmail(string $email): ?AirportCustomer;

    public function createCustomer(array $data): AirportCustomer;

    public function updateCustomer(string $id, array $data): AirportCustomer;

    public function deleteCustomer(string $id): bool;
}
