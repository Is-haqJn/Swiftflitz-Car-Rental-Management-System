<?php

namespace App\Http\Controllers\V1;

use App\DTOs\CustomerData;
use App\Enums\CustomerProfileStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\ToggleVehicleBlacklistRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\Customers\CustomerCollection;
use App\Http\Resources\Customers\CustomerResource;
use App\Mail\CompleteProfileLinkMail;
use App\Mail\DocumentReuploadMail;
use App\Models\Customer;
use App\Services\Contracts\CustomerServiceInterface;
use App\Services\Contracts\RentalServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class CustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerServiceInterface $customerService
    ) {}

    /**
     * GET /api/v1/customers
     * Display a listing of customers.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customers = $this->customerService->getFilteredCustomers(request());

        return $this->successResponse(
            data: new CustomerCollection($customers),
            message: 'Customers retrieved successfully'
        );
    }

    /**
     * Store a newly created customer.
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = $this->customerService->createCustomer(CustomerData::fromRequest($request->validated()));

        return $this->createdResponse(
            data: new CustomerResource($customer),
            message: 'Customer created successfully',
        );
    }

    /**
     * Display the specified customer.
     */
    public function show(string $id): JsonResponse
    {
        $customer = $this->customerService->getCustomer($id);

        return $this->successResponse(
            data: new CustomerResource($customer),
            message: 'Customer retrieved successfully'
        );
    }

    /**
     * Update the specified customer.
     */
    public function update(UpdateCustomerRequest $request, string $id): JsonResponse
    {
        $customerModel = Customer::findOrFail($id);
        $this->authorize('update', $customerModel);

        $customer = $this->customerService->updateCustomer($id, $request->safe()->except('passport_image'));

        if ($request->hasFile('passport_image')) {
            $customer->addMediaFromRequest('passport_image')
                ->toMediaCollection('passport');
        }

        return $this->successResponse(
            data: new CustomerResource($customer),
            message: 'Customer updated successfully'
        );
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(string $id): JsonResponse
    {
        $customerModel = Customer::findOrFail($id);
        $this->authorize('delete', $customerModel);

        $this->customerService->deleteCustomer($id);

        return $this->successResponse(
            data: null,
            message: 'Customer deleted successfully'
        );
    }

    /**
     * Get blacklisted customers.
     */
    public function blacklisted(): JsonResponse
    {
        $customers = $this->customerService->getBlacklistedCustomers(perPage: 15);

        return $this->successResponse(
            data: new CustomerCollection($customers),
            message: 'Blacklisted customers retrieved successfully'
        );
    }

    /**
     * Get active customers (not blacklisted).
     */
    public function active(): JsonResponse
    {
        $customers = $this->customerService->getActiveCustomers(perPage: 15);

        return $this->successResponse(
            data: new CustomerCollection($customers),
            message: 'Active customers retrieved successfully'
        );
    }

    /**
     * GET /api/v1/customers/lookup?email=xxx
     *
     * Global email lookup - bypasses branch scope so managers can detect
     * customers registered under other branches before submitting the booking form.
     * Returns the customer's basic info plus an `is_in_branch` flag.
     */
    public function lookup(): JsonResponse
    {
        $email = trim((string) request()->query('email', ''));

        if (empty($email)) {
            return $this->successResponse(data: null, message: 'No customer found');
        }

        // Use model directly to bypass CustomerRepository branch scope
        $customer = Customer::where('email', $email)->first();

        if (! $customer) {
            return $this->successResponse(data: null, message: 'No customer found');
        }

        // Determine whether the customer is linked to the requesting manager's branch
        $inBranch = true;
        $user = auth()->user();
        if ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            $inBranch = ! empty($branchIds)
                && $customer->branches()->whereIn('branches.id', $branchIds)->exists();
        }

        return $this->successResponse(
            data: [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'license_number' => $customer->license_number,
                'date_of_birth' => $customer->date_of_birth?->toDateString(),
                'is_in_branch' => $inBranch,
            ],
            message: 'Customer found'
        );
    }

    /**
     * Toggle blacklist status.
     */
    public function toggleBlacklist(ToggleVehicleBlacklistRequest $request, string $id): JsonResponse
    {

        $customer = $this->customerService->toggleBlacklist(
            $id,
            $request->validated('blacklist_reason')
        );

        return $this->successResponse(
            data: new CustomerResource($customer),
            message: 'Customer blacklist status updated successfully'
        );
    }

    /**
     * PATCH /api/v1/customers/{customer}/verify
     */
    public function verify(Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $customer->update([
            'profile_status' => CustomerProfileStatus::Verified->value,
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        app(RentalServiceInterface::class)->confirmPaidPendingForCustomer($customer);

        return $this->successResponse(
            data: new CustomerResource($customer->refresh()),
            message: 'Customer profile verified successfully.'
        );
    }

    /**
     * POST /api/v1/customers/{customer}/request-reupload
     */
    public function requestReupload(Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $token = bin2hex(random_bytes(32));

        $customer->update([
            'profile_status' => CustomerProfileStatus::Incomplete->value,
            'reupload_token' => $token,
            'reupload_token_expires_at' => now()->addHours(48),
        ]);

        Mail::to($customer->email)->queue(new DocumentReuploadMail($customer, $token));

        return $this->successResponse(
            data: null,
            message: 'Document reupload request sent to customer.'
        );
    }

    /**
     * POST /api/v1/customers/{customer}/send-complete-profile-link
     * Send a complete-profile link for new customers created with minimal info.
     */
    public function sendCompleteProfileLink(Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $token = bin2hex(random_bytes(32));

        $customer->update([
            'profile_status' => CustomerProfileStatus::Incomplete->value,
            'reupload_token' => $token,
            'reupload_token_expires_at' => now()->addHours(48),
        ]);

        Mail::to($customer->email)->queue(new CompleteProfileLinkMail($customer, $token));

        return $this->successResponse(
            data: null,
            message: 'Profile completion link sent to customer.'
        );
    }
}
