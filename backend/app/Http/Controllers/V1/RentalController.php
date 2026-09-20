<?php

namespace App\Http\Controllers\V1;

use App\DTOs\RentalData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveReturnRequest;
use App\Http\Requests\CancelRentalRequest;
use App\Http\Requests\ExtendRentalRequest;
use App\Http\Requests\ProcessPickupRequest;
use App\Http\Requests\ProcessReturnRequest;
use App\Http\Requests\RecordRepairCostRequest;
use App\Http\Requests\SendInvoiceRequest;
use App\Http\Requests\SettleDamageRequest;
use App\Http\Requests\SettleRefundRequest;
use App\Http\Requests\SettleRentalRequest;
use App\Http\Requests\StoreRentalRequest;
use App\Http\Requests\SwitchVehicleRequest;
use App\Http\Requests\UpdateRentalRequest;
use App\Http\Requests\UploadRentalVideosRequest;
use App\Http\Resources\RentalResource;
use App\Models\Rental;
use App\Services\Contracts\PricingServiceInterface;
use App\Services\Contracts\RentalServiceInterface;
use App\Services\TusUpload\TusTempFileResolver;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected RentalServiceInterface $rentalService,
        protected PricingServiceInterface $pricingService,
        protected TusTempFileResolver $tusResolver,
    ) {}

    /**
     * GET /api/v1/rentals
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Rental::class);

        $rentals = $this->rentalService->getAll();

        return $this->successResponse(RentalResource::collection($rentals));
    }

    /**
     * POST /api/v1/rentals
     */
    public function store(StoreRentalRequest $request): JsonResponse
    {
        $this->authorize('create', Rental::class);

        $rental = $this->rentalService->create(
            RentalData::fromRequest($request->validated())
        );

        return $this->createdResponse(
            new RentalResource($rental),
            'Rental created successfully.'
        );
    }

    /**
     * GET /api/v1/rentals/{rental}
     */
    public function show(Rental $rental): JsonResponse
    {
        $this->authorize('view', $rental);

        $rental = $this->rentalService->findRental($rental->id);

        return $this->successResponse(new RentalResource($rental));
    }

    /**
     * PUT /api/v1/rentals/{rental}
     */
    public function update(UpdateRentalRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('update', $rental);

        $updated = $this->rentalService->update($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Rental updated successfully.'
        );
    }

    /**
     * DELETE /api/v1/rentals/{rental}
     */
    public function destroy(Rental $rental): JsonResponse
    {
        $this->authorize('delete', $rental);

        $this->rentalService->delete($rental->id);

        return $this->noContentResponse();
    }

    /**
     * POST /api/v1/rentals/{rental}/confirm
     */
    public function confirm(Rental $rental): JsonResponse
    {
        $this->authorize('confirm', $rental);

        $updated = $this->rentalService->confirm($rental->id);

        return $this->successResponse(
            new RentalResource($updated),
            'Rental confirmed successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/pickup
     */
    public function processPickup(ProcessPickupRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('processPickup', $rental);

        $photoFiles = $this->tusResolver->resolveMany(
            $request->input('photo_tus_tokens', [])
        );

        $updated = $this->rentalService->processPickup($rental->id, $request->validated(), $photoFiles);

        return $this->successResponse(
            new RentalResource($updated),
            'Pickup processed successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/return
     */
    public function processReturn(ProcessReturnRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('processReturn', $rental);

        $photoFiles = $this->tusResolver->resolveMany(
            $request->input('photo_tus_tokens', [])
        );

        $updated = $this->rentalService->processReturn($rental->id, $request->validated(), $photoFiles);

        return $this->successResponse(
            new RentalResource($updated),
            'Return processed successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/approve-return
     */
    public function approveReturn(ApproveReturnRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('approveReturn', $rental);

        $updated = $this->rentalService->approveReturn($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Return approved and rental completed.'
        );
    }

    /**
     * GET /api/v1/rentals/{rental}/cancel-preview
     */
    public function cancelPreview(Rental $rental): JsonResponse
    {
        $this->authorize('cancel', $rental);

        $data = $this->pricingService->calculateCancellation($rental);
        $fee = round((float) $data['fee'], 2);
        $daysUsedCost = round((float) ($data['days_used_cost'] ?? 0.0), 2);
        $totalDeduction = round($fee + $daysUsedCost, 2);
        $amountPaid = (float) $rental->amount_paid;

        return $this->successResponse([
            'cancellation_fee' => $fee,
            'days_used_cost' => $daysUsedCost,
            'total_deduction' => $totalDeduction,
            'refund_amount' => round(max(0.0, $amountPaid - $totalDeduction), 2),
            'cancellation_amount_owed' => round(max(0.0, $totalDeduction - $amountPaid), 2),
            'deposit_paid' => (float) $rental->deposit_paid,
            'reason' => $data['reason'],
        ]);
    }

    /**
     * POST /api/v1/rentals/{rental}/cancel
     */
    public function cancel(CancelRentalRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('cancel', $rental);

        $updated = $this->rentalService->cancel($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Rental cancelled successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/switch-vehicle
     */
    public function switchVehicle(SwitchVehicleRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('update', $rental);

        $updated = $this->rentalService->switchVehicle($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Vehicle switched successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/settle
     */
    public function settle(SettleRentalRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->settleRental($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Rental settled successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/settle-damage
     */
    public function settleDamage(SettleDamageRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->settleDamage($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Damage settlement recorded.'
        );
    }

    /**
     * PATCH /api/v1/rentals/{rental}/record-repair-cost
     */
    public function recordRepairCost(RecordRepairCostRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->recordRepairCost($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Repair cost recorded.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/collect-damage-balance
     */
    public function collectDamageBalance(Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->collectDamageBalance($rental->id);

        return $this->successResponse(
            new RentalResource($updated),
            'Damage balance collected.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/collect-deposit
     */
    public function collectDeposit(Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->collectDeposit($rental->id);

        return $this->successResponse(
            new RentalResource($updated),
            'Security deposit collected.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/refund-deposit
     */
    public function refundDeposit(Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->refundDeposit($rental->id);

        return $this->successResponse(
            new RentalResource($updated),
            'Security deposit refunded.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/settle-with-deposit
     */
    public function settleWithDeposit(Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->settleWithDeposit($rental->id);

        return $this->successResponse(
            new RentalResource($updated),
            'Security deposit applied to rental balance.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/settle-refund
     */
    public function settleRefund(SettleRefundRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $updated = $this->rentalService->settleRefund($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Refund settled.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/waive-overdue
     */
    public function waiveOverdue(Rental $rental): JsonResponse
    {
        $this->authorize('settle', $rental);

        $reason = request()->input('reason', '');
        $updated = $this->rentalService->waivedOverdue($rental->id, $reason);

        return $this->successResponse(
            new RentalResource($updated),
            'Overdue fee waived.'
        );
    }

    /**
     * GET /api/v1/rentals/{rental}/extend-preview
     */
    public function extendPreview(Request $request, Rental $rental): JsonResponse
    {
        $this->authorize('update', $rental);

        $request->validate([
            'new_return_date' => ['required', 'date', 'after:today'],
        ]);

        $preview = $this->rentalService->getExtendPreview($rental->id, $request->input('new_return_date'));

        return $this->successResponse($preview);
    }

    /**
     * POST /api/v1/rentals/{rental}/extend
     */
    public function extend(ExtendRentalRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('update', $rental);

        $updated = $this->rentalService->extendRental($rental->id, $request->validated());

        return $this->successResponse(
            new RentalResource($updated),
            'Rental extended successfully.'
        );
    }

    /**
     * POST /api/v1/rentals/{rental}/send-payment-link
     */
    public function sendPaymentLink(Rental $rental): JsonResponse
    {
        $this->authorize('sendPaymentLink', $rental);
        $this->rentalService->sendPaymentLink($rental);

        return $this->successResponse(null, 'Payment link sent to customer.');
    }

    /**
     * POST /api/v1/rentals/{rental}/send-damage-payment-link
     */
    public function sendDamagePaymentLink(Rental $rental): JsonResponse
    {
        $this->authorize('sendPaymentLink', $rental);
        $this->rentalService->sendDamagePaymentLink($rental);

        return $this->successResponse(null, 'Damage payment link sent to customer.');
    }

    /**
     * POST /api/v1/rentals/{rental}/send-security-deposit-payment-link
     */
    public function sendSecurityDepositPaymentLink(Rental $rental): JsonResponse
    {
        $this->authorize('sendPaymentLink', $rental);
        $this->rentalService->sendSecurityDepositPaymentLink($rental);

        return $this->successResponse(null, 'Security deposit payment link sent to customer.');
    }

    /**
     * POST /api/v1/rentals/{rental}/send-invoice
     */
    public function sendInvoice(SendInvoiceRequest $request, Rental $rental): JsonResponse
    {
        $this->rentalService->sendInvoiceToCustomer($rental, $request->validated('note'));

        return response()->json(['message' => 'Invoice sent to customer successfully.']);
    }

    /**
     * POST /api/v1/rentals/{rental}/upload-pickup-videos
     */
    public function uploadPickupVideos(UploadRentalVideosRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('uploadVideos', $rental);

        $files = $this->tusResolver->resolveMany($request->validated('video_tus_tokens'));
        $updated = $this->rentalService->attachPickupVideos($rental, $files);

        return $this->successResponse(new RentalResource($updated), 'Pickup videos uploaded.');
    }

    /**
     * POST /api/v1/rentals/{rental}/upload-return-videos
     */
    public function uploadReturnVideos(UploadRentalVideosRequest $request, Rental $rental): JsonResponse
    {
        $this->authorize('uploadVideos', $rental);

        $files = $this->tusResolver->resolveMany($request->validated('video_tus_tokens'));
        $updated = $this->rentalService->attachReturnVideos($rental, $files);

        return $this->successResponse(new RentalResource($updated), 'Return videos uploaded.');
    }
}
