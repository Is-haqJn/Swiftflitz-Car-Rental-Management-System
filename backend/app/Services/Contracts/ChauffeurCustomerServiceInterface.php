<?php

namespace App\Services\Contracts;

use App\DTOs\ChauffeurCustomerData;
use App\Models\ChauffeurCustomer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ChauffeurCustomerServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function getCustomer(string $id): ChauffeurCustomer;

    public function findByEmail(string $email): ?ChauffeurCustomer;

    /** Find existing customer by email, or create a new one from booking data. */
    public function findOrCreate(string $fullName, ?string $email, string $phone, ?string $expectedDestination): ChauffeurCustomer;

    public function create(ChauffeurCustomerData $data): ChauffeurCustomer;

    public function update(string $id, array $data): ChauffeurCustomer;

    public function delete(string $id): bool;
}
