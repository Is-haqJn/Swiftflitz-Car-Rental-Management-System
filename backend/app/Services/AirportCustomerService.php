<?php

namespace App\Services;

use App\DTOs\AirportBookingData;
use App\DTOs\AirportCustomerData;
use App\Models\AirportCustomer;
use App\Repositories\Contracts\AirportCustomerRepositoryInterface;
use App\Services\Contracts\AirportCustomerServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AirportCustomerService implements AirportCustomerServiceInterface
{
    public function __construct(
        protected AirportCustomerRepositoryInterface $customerRepository,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->customerRepository->getAll($perPage);
    }

    public function getCustomer(string $id): AirportCustomer
    {
        return $this->customerRepository->findCustomer($id);
    }

    public function findByEmail(string $email): ?AirportCustomer
    {
        return $this->customerRepository->findByEmail($email);
    }

    public function findOrCreateFromBookingData(AirportBookingData $data): AirportCustomer
    {
        $existing = $this->customerRepository->findByEmail($data->customerEmail);

        if ($existing) {
            return $existing;
        }

        return $this->customerRepository->createCustomer([
            'full_name' => $data->customerFullName,
            'email' => $data->customerEmail,
            'phone' => $data->customerPhone,
        ]);
    }

    public function create(AirportCustomerData $data): AirportCustomer
    {
        return $this->customerRepository->createCustomer($data->toArray());
    }

    public function update(string $id, array $data): AirportCustomer
    {
        return $this->customerRepository->updateCustomer($id, $data);
    }

    public function delete(string $id): bool
    {
        return $this->customerRepository->deleteCustomer($id);
    }
}
