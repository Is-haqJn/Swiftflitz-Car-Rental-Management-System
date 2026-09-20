<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportCustomerData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAirportCustomerRequest;
use App\Http\Requests\UpdateAirportCustomerRequest;
use App\Http\Resources\AirportCustomerCollection;
use App\Http\Resources\AirportCustomerResource;
use App\Models\AirportCustomer;
use App\Services\Contracts\AirportCustomerServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AirportCustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportCustomerServiceInterface $customerService,
    ) {}

    /**
     * GET /api/v1/airport-customers
     */
    public function index(): JsonResponse
    {
        $customers = $this->customerService->getAll();

        return $this->successResponse(new AirportCustomerCollection($customers));
    }

    /**
     * GET /api/v1/airport-customers/lookup?email=xxx
     */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $customer = $this->customerService->findByEmail($request->input('email'));

        if (! $customer) {
            return response()->json(['message' => 'No customer found with this email.'], 404);
        }

        return $this->successResponse(new AirportCustomerResource($customer), 'Customer found.');
    }

    /**
     * POST /api/v1/airport-customers
     */
    public function store(StoreAirportCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create(
            AirportCustomerData::fromRequest($request->validated())
        );

        return $this->createdResponse(new AirportCustomerResource($customer), 'Airport customer created successfully.');
    }

    /**
     * GET /api/v1/airport-customers/{airportCustomer}
     */
    public function show(AirportCustomer $airportCustomer): JsonResponse
    {
        return $this->successResponse(new AirportCustomerResource($airportCustomer));
    }

    /**
     * PUT /api/v1/airport-customers/{airportCustomer}
     */
    public function update(UpdateAirportCustomerRequest $request, AirportCustomer $airportCustomer): JsonResponse
    {
        $updated = $this->customerService->update($airportCustomer->id, $request->validated());

        return $this->successResponse(new AirportCustomerResource($updated), 'Airport customer updated successfully.');
    }

    /**
     * DELETE /api/v1/airport-customers/{airportCustomer}
     */
    public function destroy(AirportCustomer $airportCustomer): JsonResponse
    {
        $this->customerService->delete($airportCustomer->id);

        return $this->noContentResponse();
    }
}
