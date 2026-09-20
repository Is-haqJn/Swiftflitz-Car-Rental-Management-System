<?php

namespace App\Services\Contracts;

use App\DTOs\CustomerData;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

interface CustomerServiceInterface
{
    /**
     * Get paginated customer list with filters.
     */
    public function getFilteredCustomers(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a single customer by ID.
     */
    public function getCustomer(string $id): Customer;

    /**
     * Create a new customer.
     */
    public function createCustomer(CustomerData $data): Customer;

    /**
     * Update an existing customer.
     */
    public function updateCustomer(string $id, array $data): Customer;

    /**
     * Delete a customer.
     */
    public function deleteCustomer(string $id): bool;

    /**
     * Get blacklisted customers.
     */
    public function getBlacklistedCustomers(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get active customers (not blacklisted).
     */
    public function getActiveCustomers(int $perPage = 15): LengthAwarePaginator;

    /**
     * Toggle blacklist status.
     */
    public function toggleBlacklist(string $id, ?string $reason = null): Customer;

    /**
     * Check if customer exists by email.
     */
    public function existsByEmail(string $email): bool;

    /**
     * Check if customer exists by phone.
     */
    public function existsByPhone(string $phone): bool;

    /**
     * Check if customer exists by license number.
     */
    public function existsByLicenseNumber(string $licenseNumber): bool;
}
