<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PreviewPricingRequest;
use App\Http\Resources\PricingBreakdownResource;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Services\Contracts\PricingServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PricingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PricingServiceInterface $pricingService,
    ) {}

    /**
     * POST /api/v1/pricing/preview
     */
    public function preview(PreviewPricingRequest $request): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($request->vehicle_id);
        $customer = $request->customer_id ? Customer::find($request->customer_id) : null;
        $bookingBranch = $request->branch_id ? Branch::find($request->branch_id) : null;

        $breakdown = $this->pricingService->calculate(
            vehicle: $vehicle,
            pickupDate: $request->pickup_date,
            returnDate: $request->return_date,
            customer: $customer,
            addons: $request->addons ?? [],
            pickupLocationId: $request->pickup_location_id,
            dropoffLocationId: $request->dropoff_location_id,
            couponCode: $request->coupon_code,
            manualDiscount: (float) ($request->manual_discount ?? 0),
            manualDiscountReason: $request->manual_discount_reason,
            skipDeposit: (bool) ($request->skip_deposit ?? false),
            bookingBranch: $bookingBranch,
            youngDriverOverride: $request->has('young_driver') ? (bool) $request->young_driver : null,
        );

        return $this->successResponse(new PricingBreakdownResource($breakdown));
    }
}
