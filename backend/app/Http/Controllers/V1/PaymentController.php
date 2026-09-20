<?php

namespace App\Http\Controllers\V1;

use App\DTOs\PaymentInitiateData;
use App\Enums\CustomerProfileStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\InitiatePaymentRequest;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\Rental;
use App\Services\Contracts\PaymentServiceInterface;
use App\Traits\ApiResponse;
use BackedEnum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PaymentServiceInterface $paymentService) {}

    /**
     * POST /api/v1/payments/initiate
     * Initiate a payment and return the provider's redirect URL.
     * The amount is resolved server-side from the transactable record.
     */
    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $this->resolveAndAuthorizeTransactable(
            $request->input('transactable_type'),
            $request->input('transactable_id'),
        );

        try {
            $result = $this->paymentService->initiate(
                PaymentInitiateData::fromRequest($request->validated())
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        if (! $result->success) {
            return $this->errorResponse(
                $result->meta['error'] ?? 'Failed to initiate payment.',
                422
            );
        }

        return $this->successResponse([
            'reference' => $result->reference,
            'authorization_url' => $result->authorizationUrl,
            'meta' => $result->meta,
        ], 'Payment initiated successfully.', 201);
    }

    /**
     * GET /api/v1/payments/payable-amount
     * Return the authoritative payable amount for a transactable.
     * Used by the frontend to display and verify the correct amount before payment.
     */
    public function payableAmount(Request $request): JsonResponse
    {
        $request->validate([
            'transactable_type' => ['required', 'string', 'in:rental,airport_booking,chauffeur_booking'],
            'transactable_id' => ['required', 'string', 'uuid'],
            'purpose' => ['sometimes', 'nullable', 'string', 'in:damage,deposit'],
        ]);

        $this->resolveAndAuthorizeTransactable(
            $request->input('transactable_type'),
            $request->input('transactable_id'),
            abortOnMissing: false,
        );

        try {
            $amount = $this->paymentService->resolvePayableAmount(
                $request->input('transactable_type'),
                $request->input('transactable_id'),
                $request->input('purpose'),
            );
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }

        $customerProfileComplete = $this->resolveProfileComplete(
            $request->input('transactable_type'),
            $request->input('transactable_id'),
        );

        /* already_paid = no money owed, regardless of payment_status.
           Covers: fully paid with fees still pending ($amount > 0 → false), zero-cost/coupon, damage settled. */
        $alreadyPaid = $amount <= 0.0;

        return $this->successResponse([
            'amount' => $amount,
            'currency' => $this->paymentService->resolveTransactableCurrency(
                $request->input('transactable_type'),
                $request->input('transactable_id'),
            ),
            'customer_profile_complete' => $customerProfileComplete['complete'],
            'profile_error_code' => $customerProfileComplete['error_code'],
            'profile_complete_token' => $customerProfileComplete['profile_complete_token'],
            'already_paid' => $alreadyPaid,
        ], 'Payable amount resolved.');
    }

    /**
     * GET /api/v1/payments/verify/{reference}
     * Verify the status of a payment.
     */
    public function verify(string $reference): JsonResponse
    {
        $result = $this->paymentService->verify($reference);

        return $this->successResponse([
            'status' => $result->status,
            'amount' => $result->amount,
            'meta' => $result->meta,
        ], 'Payment verification complete.');
    }

    /**
     * GET /api/v1/payments/status/{reference}
     * Return the DB-only payment status without calling the external provider API.
     * Safe to poll frequently - never makes outbound HTTP requests.
     */
    public function status(string $reference): JsonResponse
    {
        return $this->successResponse(
            $this->paymentService->getStatus($reference),
            'Payment status retrieved.'
        );
    }

    /**
     * POST /api/v1/payments/webhook/{provider}
     * Handle inbound webhook from a payment provider.
     * Always returns HTTP 200 to prevent retry loops.
     */
    public function webhook(string $provider, Request $request): JsonResponse
    {
        try {
            $this->paymentService->handleWebhook($provider, $request);
        } catch (Throwable $e) {
            Log::error('Webhook processing failed', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Load the transactable by type + id and authorize access.
     *
     * When $abortOnMissing is true, aborts 422 if the record does not exist
     * (initiate() path). When false, returns null and defers not-found
     * handling to the downstream service (payableAmount() path).
     *
     * Unauthenticated callers (customers on public payment pages) pass through -
     * UUID unpredictability is the access-control mechanism for that path.
     * Authenticated staff are checked against the transactable's policy, which
     * enforces branch-scope for non-admin roles.
     */
    private function resolveAndAuthorizeTransactable(
        string $type,
        string $id,
        bool $abortOnMissing = true,
    ): ?\Illuminate\Database\Eloquent\Model {
        $transactable = match ($type) {
            'rental' => Rental::find($id),
            'airport_booking' => AirportBooking::find($id),
            'chauffeur_booking' => ChauffeurBooking::find($id),
            default => abort(422, 'Invalid transactable type.'),
        };

        if (! $transactable) {
            if ($abortOnMissing) {
                abort(422, 'Transactable not found.');
            }

            return null;
        }

        if (request()->user() !== null) {
            $this->authorize('view', $transactable);
        }

        return $transactable;
    }

    /**
     * Determine whether the target transactable is already fully paid / settled.
     * For purpose=damage, checks damage_settlement_status. Otherwise checks payment_status.
     */
    private function resolveAlreadyPaid(string $type, string $id, ?string $purpose = null): bool
    {
        $model = match ($type) {
            'rental' => Rental::find($id),
            'airport_booking' => AirportBooking::find($id),
            'chauffeur_booking' => ChauffeurBooking::find($id),
            default => null,
        };

        if (! $model) {
            return false;
        }

        if ($type === 'rental' && $purpose === 'damage') {
            return $model->damage_settlement_status === 'settled';
        }

        if ($type === 'rental' && $purpose === 'deposit') {
            return in_array($model->security_deposit_status, ['held', 'applied', 'refunded'], true);
        }

        $status = $model->payment_status;

        return in_array($status instanceof BackedEnum ? $status->value : $status, ['paid', 'refunded'], true);
    }

    /**
     * Determine whether the customer's profile is complete for the given transactable.
     * Only applicable to rentals - airport/chauffeur bookings collect their own data.
     *
     * @return array{complete: bool, error_code: string|null, profile_complete_token: string|null}
     */
    private function resolveProfileComplete(string $type, string $id): array
    {
        if ($type !== 'rental') {
            return ['complete' => true, 'error_code' => null, 'profile_complete_token' => null];
        }

        $rental = Rental::with('customer')->find($id);

        if (! $rental || ! $rental->customer) {
            return ['complete' => false, 'error_code' => null, 'profile_complete_token' => null];
        }

        $customer = $rental->customer;
        $status = $customer->profile_status;

        if ($status === CustomerProfileStatus::Incomplete || $status === CustomerProfileStatus::Rejected) {
            $token = null;

            if ($customer->reupload_token
                && $customer->reupload_token_expires_at
                && ! $customer->reupload_token_expires_at->isPast()
            ) {
                $token = $customer->reupload_token;
            }

            return ['complete' => false, 'error_code' => null, 'profile_complete_token' => $token];
        }

        $fieldsComplete = filled($customer->id_number)
            && filled($customer->license_number)
            && filled($customer->address);

        if (! $fieldsComplete) {
            return ['complete' => false, 'error_code' => null, 'profile_complete_token' => null];
        }

        if ($customer->license_expiry_date !== null && $customer->license_expiry_date->isPast()) {
            return ['complete' => false, 'error_code' => 'PROFILE_LICENSE_EXPIRED', 'profile_complete_token' => null];
        }

        return ['complete' => true, 'error_code' => null, 'profile_complete_token' => null];
    }
}
