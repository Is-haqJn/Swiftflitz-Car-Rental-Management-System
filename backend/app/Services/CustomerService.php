<?php

namespace App\Services;

use App\DTOs\CustomerData;
use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Services\Contracts\CustomerServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class CustomerService implements CustomerServiceInterface
{
    public function __construct(
        protected CustomerRepositoryInterface $customerRepository
    ) {}

    public function getFilteredCustomers(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->customerRepository->query();

        if ($request && $request->has('license_status')) {
            $licenseStatus = $request->input('license_status');
            if ($licenseStatus === 'expired') {
                $query->where('license_expiry_date', '<', now());
            } elseif ($licenseStatus === 'expiring_soon') {
                $query->whereBetween('license_expiry_date', [now(), now()->addDays(30)]);
            }

        }

        return $query->paginate($perPage)->withPath($this->customerRepository->paginatedPath);
    }

    public function getCustomer(string $id): Customer
    {
        return $this->customerRepository->findOrFail($id)->load('branches');
    }

    public function createCustomer(CustomerData $customerData): Customer
    {
        $customer = $this->customerRepository->create($customerData->toArray());

        // Link to all branches of the creating manager
        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            if (! empty($branchIds)) {
                $customer->branches()->syncWithoutDetaching($branchIds);
            }
        }

        return $customer;
    }

    public function updateCustomer(string $id, array $data): Customer
    {
        return $this->customerRepository->update($id, $data);
    }

    public function deleteCustomer(string $id): bool
    {
        $customer = $this->customerRepository->find($id);

        $activeStatuses = ['pending', 'confirmed', 'active', 'overdue', 'returned'];

        $hasActiveRental = $customer->rentals()
            ->whereIn('status', $activeStatuses)
            ->exists();

        if ($hasActiveRental) {
            abort(422, 'This customer has an active rental and cannot be deleted until it is resolved.');
        }

        return $this->customerRepository->delete($id);
    }

    public function getBlacklistedCustomers(int $perPage = 15): LengthAwarePaginator
    {
        return $this->customerRepository->getBlacklisted($perPage);
    }

    public function getActiveCustomers(int $perPage = 15): LengthAwarePaginator
    {
        return $this->customerRepository->getActive($perPage);
    }

    public function toggleBlacklist(string $id, ?string $reason = null): Customer
    {
        $customer = $this->getCustomer($id);
        $customer->is_blacklisted = ! $customer->is_blacklisted;
        $customer->blacklist_reason = $reason;
        $customer->save();

        return $customer;
    }

    public function existsByEmail(string $email): bool
    {
        return $this->customerRepository->findByEmail($email) !== null;
    }

    public function existsByPhone(string $phone): bool
    {
        return $this->customerRepository->findByPhone($phone) !== null;
    }

    public function existsByLicenseNumber(string $licenseNumber): bool
    {
        return $this->customerRepository->findByLicenseNumber($licenseNumber) !== null;
    }
}
