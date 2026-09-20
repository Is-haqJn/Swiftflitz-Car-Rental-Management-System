<?php

namespace App\Http\Controllers\V1;

use App\DTOs\DiscountCouponData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiscountCouponRequest;
use App\Http\Requests\UpdateDiscountCouponRequest;
use App\Http\Resources\DiscountCouponResource;
use App\Models\DiscountCoupon;
use App\Services\Contracts\DiscountCouponServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountCouponController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DiscountCouponServiceInterface $couponService,
    ) {}

    /**
     * GET /api/v1/coupons
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', DiscountCoupon::class);

        $coupons = $this->couponService->getAll();

        return $this->successResponse(DiscountCouponResource::collection($coupons));
    }

    /**
     * POST /api/v1/coupons
     */
    public function store(StoreDiscountCouponRequest $request): JsonResponse
    {
        $this->authorize('create', DiscountCoupon::class);

        $coupon = $this->couponService->create(
            DiscountCouponData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            new DiscountCouponResource($coupon->load('scopes')),
            'Coupon created successfully.'
        );
    }

    /**
     * GET /api/v1/coupons/{discountCoupon}
     */
    public function show(DiscountCoupon $coupon): JsonResponse
    {
        $this->authorize('view', $coupon);

        return $this->successResponse(new DiscountCouponResource($coupon->load('scopes')));
    }

    /**
     * PUT /api/v1/coupons/{discountCoupon}
     */
    public function update(UpdateDiscountCouponRequest $request, DiscountCoupon $coupon): JsonResponse
    {
        $this->authorize('update', $coupon);

        $updated = $this->couponService->update($coupon->id, $request->validated());

        return $this->successResponse(
            new DiscountCouponResource($updated->load('scopes')),
            'Coupon updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/coupons/{discountCoupon}
     */
    public function destroy(DiscountCoupon $coupon): JsonResponse
    {
        $this->authorize('delete', $coupon);

        $this->couponService->delete($coupon->id);

        return $this->noContentResponse();
    }

    /**
     * GET /api/v1/coupons/validate?code=SF12345&customer_id=...&context=airport&context_id=...
     */
    public function validateCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'customer_id' => ['nullable', 'string'],
            'context' => ['nullable', 'string'],
            'context_id' => ['nullable', 'string'],
        ]);

        $coupon = $this->couponService->validateCode(
            $request->string('code'),
            $request->string('customer_id') ?: null,
            $request->string('context') ?: null,
            $request->string('context_id') ?: null,
        );

        return $this->successResponse(new DiscountCouponResource($coupon->load('scopes')));
    }
}
