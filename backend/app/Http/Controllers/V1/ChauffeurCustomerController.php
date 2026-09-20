<?php

namespace App\Http\Controllers\V1;

use App\DTOs\ChauffeurCustomerData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChauffeurCustomerRequest;
use App\Http\Requests\UpdateChauffeurCustomerRequest;
use App\Http\Resources\ChauffeurCustomerCollection;
use App\Http\Resources\ChauffeurCustomerResource;
use App\Models\ChauffeurCustomer;
use App\Services\Contracts\ChauffeurCustomerServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChauffeurCustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChauffeurCustomerServiceInterface $customerService,
    ) {}

    /**
     * GET /api/v1/chauffeur-customers
     */
    public function index(): JsonResponse
    {
        $customers = $this->customerService->getAll();

        return $this->successResponse(new ChauffeurCustomerCollection($customers));
    }

    /**
     * GET /api/v1/chauffeur-customers/lookup?email=xxx
     */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $customer = $this->customerService->findByEmail($request->input('email'));

        if (! $customer) {
            return $this->notFoundResponse('No chauffeur customer found with this email.');
        }

        return $this->successResponse(new ChauffeurCustomerResource($customer), 'Customer found.');
    }

    /**
     * POST /api/v1/chauffeur-customers
     */
    public function store(StoreChauffeurCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create(
            ChauffeurCustomerData::fromRequest($request->validated())
        );

        return $this->createdResponse(new ChauffeurCustomerResource($customer), 'Chauffeur customer created successfully.');
    }

    /**
     * GET /api/v1/chauffeur-customers/{chauffeurCustomer}
     */
    public function show(ChauffeurCustomer $chauffeurCustomer): JsonResponse
    {
        return $this->successResponse(new ChauffeurCustomerResource($chauffeurCustomer));
    }

    /**
     * PUT /api/v1/chauffeur-customers/{chauffeurCustomer}
     */
    public function update(UpdateChauffeurCustomerRequest $request, ChauffeurCustomer $chauffeurCustomer): JsonResponse
    {
        $updated = $this->customerService->update($chauffeurCustomer->id, $request->validated());

        return $this->successResponse(new ChauffeurCustomerResource($updated), 'Chauffeur customer updated successfully.');
    }

    /**
     * DELETE /api/v1/chauffeur-customers/{chauffeurCustomer}
     */
    public function destroy(ChauffeurCustomer $chauffeurCustomer): JsonResponse
    {
        $this->customerService->delete($chauffeurCustomer->id);

        return $this->noContentResponse();
    }
}
