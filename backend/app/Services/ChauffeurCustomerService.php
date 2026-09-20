<?php

namespace App\Services;

use App\DTOs\ChauffeurCustomerData;
use App\Models\ChauffeurCustomer;
use App\Repositories\Contracts\ChauffeurCustomerRepositoryInterface;
use App\Services\Contracts\ChauffeurCustomerServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ChauffeurCustomerService implements ChauffeurCustomerServiceInterface
{
    public function __construct(
        protected ChauffeurCustomerRepositoryInterface $customerRepository,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->customerRepository->getAll($perPage);
    }

    public function getCustomer(string $id): ChauffeurCustomer
    {
        return $this->customerRepository->findCustomer($id);
    }

    public function findByEmail(string $email): ?ChauffeurCustomer
    {
        return $this->customerRepository->findByEmail($email);
    }

    public function findOrCreate(string $fullName, ?string $email, string $phone, ?string $expectedDestination): ChauffeurCustomer
    {
        if ($email) {
            $existing = $this->customerRepository->findByEmail($email);

            if ($existing) {
                return $existing;
            }
        }

        return $this->customerRepository->createCustomer(array_filter([
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'expected_destination' => $expectedDestination,
        ], fn ($v) => $v !== null));
    }

    public function create(ChauffeurCustomerData $data): ChauffeurCustomer
    {
        return $this->customerRepository->createCustomer($data->toArray());
    }

    public function update(string $id, array $data): ChauffeurCustomer
    {
        return $this->customerRepository->updateCustomer($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->customerRepository->deleteCustomer($id);
    }
}
