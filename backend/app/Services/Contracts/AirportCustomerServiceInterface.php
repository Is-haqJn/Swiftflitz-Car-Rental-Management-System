<?php

namespace App\Services\Contracts;

use App\DTOs\AirportBookingData;
use App\DTOs\AirportCustomerData;
use App\Models\AirportCustomer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AirportCustomerServiceInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;

    public function getCustomer(string $id): AirportCustomer;

    public function findByEmail(string $email): ?AirportCustomer;

    public function findOrCreateFromBookingData(AirportBookingData $data): AirportCustomer;

    public function create(AirportCustomerData $data): AirportCustomer;

    public function update(string $id, array $data): AirportCustomer;

    public function delete(string $id): bool;
}
