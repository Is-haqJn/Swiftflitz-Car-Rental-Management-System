<?php

namespace App\Http\Controllers\V1\Public;

use App\DTOs\QuoteRequestData;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicConfirmQuoteRequest;
use App\Http\Requests\PublicSubmitQuoteRequest;
use App\Http\Resources\Rentals\QuoteRequestResource;
use App\Models\BookingVerificationToken;
use App\Services\Contracts\QuoteRequestServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected QuoteRequestServiceInterface $quoteRequestService,
    ) {}

    /**
     * POST /api/v1/public/bookings
     * Customer submits a quote request from the website.
     */
    public function store(PublicSubmitQuoteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // If a verified booking session is supplied, associate the quote with that customer
        $customerId = null;

        if (! empty($validated['session_id'])) {
            $session = BookingVerificationToken::where('session_id', $validated['session_id'])
                ->latest()
                ->first();

            if ($session && $session->isVerified() && ! $session->isExpired()) {
                $customerId = $session->customer_id;
            }
        }

        $validated['customer_id'] = $customerId;
        $validated['requested_addon_ids'] = $validated['addon_ids'] ?? null;

        $quote = $this->quoteRequestService->create(
            QuoteRequestData::fromRequest($validated)
        );

        return $this->createdResponse(
            new QuoteRequestResource($quote),
            'Quote request submitted successfully. We will prepare your quote and contact you shortly.'
        );
    }

    /**
     * GET /api/v1/public/quotes/{token}
     * Customer retrieves their quote by token.
     */
    public function show(string $token): JsonResponse
    {
        $quote = $this->quoteRequestService->getByToken($token);

        return $this->successResponse(new QuoteRequestResource($quote));
    }

    /**
     * POST /api/v1/public/quotes/{token}/confirm
     * Customer confirms the quote to create a rental.
     */
    public function confirm(PublicConfirmQuoteRequest $request, string $token): JsonResponse
    {
        $quote = $this->quoteRequestService->getByToken($token);

        $result = $this->quoteRequestService->confirmByCustomer($quote, $request->validated());

        if ($result['status'] === 'pending_review') {
            return response()->json([
                'status' => 'pending_review',
                'message' => 'Your booking is under review. Our team will contact you shortly to complete your reservation.',
            ], 202);
        }

        $rental = $result['rental'];

        return $this->createdResponse(
            [
                'status' => 'converted',
                'rental_id' => $rental->id,
                'rental_reference' => $rental->reference,
                'amount' => (float) $rental->total_cost,
                'payer_name' => $rental->customer?->name,
                'payer_email' => $rental->customer?->email,
                'payer_phone' => $rental->customer?->phone,
            ],
            'Booking confirmed successfully.'
        );
    }

    /**
     * POST /api/v1/public/quotes/{token}/book-returning
     * Returning customer confirms their quote directly - no profile form needed.
     */
    public function bookReturning(Request $request, string $token): JsonResponse
    {
        $quote = $this->quoteRequestService->getByToken($token);

        $result = $this->quoteRequestService->bookReturning($quote, $request->input('alt_phone'));

        $rental = $result['rental'];

        return $this->createdResponse(
            [
                'status' => 'converted',
                'rental_id' => $rental->id,
                'rental_reference' => $rental->reference,
                'amount' => (float) $rental->total_cost,
                'payer_name' => $rental->customer?->name,
                'payer_email' => $rental->customer?->email,
                'payer_phone' => $rental->customer?->phone,
            ],
            'Booking confirmed successfully.'
        );
    }

    /**
     * POST /api/v1/public/quotes/{token}/cancel
     * Customer cancels a quote request.
     */
    public function cancel(string $token): JsonResponse
    {
        $quote = $this->quoteRequestService->getByToken($token);

        $this->quoteRequestService->cancel($quote);

        return $this->successResponse(null, 'Quote request cancelled.');
    }
}
