<?php

namespace App\Repositories\Contracts;

use App\Models\ChauffeurCustomer;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChauffeurCustomerRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function findCustomer(string $id): ChauffeurCustomer;

    public function findByEmail(string $email): ?ChauffeurCustomer;

    public function createCustomer(array $data): ChauffeurCustomer;

    public function updateCustomer(string $id, array $data): ChauffeurCustomer;

    public function deleteCustomer(string $id): bool;
}
