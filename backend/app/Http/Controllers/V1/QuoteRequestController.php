<?php

namespace App\Http\Controllers\V1;

use App\DTOs\QuoteRequestData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConvertQuoteRequest;
use App\Http\Requests\GenerateQuoteRequest;
use App\Http\Requests\ResolveQuoteConflictRequest;
use App\Http\Requests\StoreQuoteRequestRequest;
use App\Http\Resources\RentalResource;
use App\Http\Resources\Rentals\QuoteRequestCollection;
use App\Http\Resources\Rentals\QuoteRequestResource;
use App\Models\QuoteRequest;
use App\Services\Contracts\PricingServiceInterface;
use App\Services\Contracts\QuoteRequestServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Throwable;

class QuoteRequestController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected QuoteRequestServiceInterface $quoteRequestService,
    ) {}

    /**
     * GET /api/v1/quote-requests
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', QuoteRequest::class);

        $quotes = $this->quoteRequestService->getAll();

        return $this->successResponse(new QuoteRequestCollection($quotes));
    }

    /**
     * POST /api/v1/quote-requests
     */
    public function store(StoreQuoteRequestRequest $request): JsonResponse
    {
        $this->authorize('create', QuoteRequest::class);

        $quote = $this->quoteRequestService->create(
            QuoteRequestData::fromRequest($request->validated())
        );

        return $this->createdResponse(new QuoteRequestResource($quote), 'Quote request created successfully.');
    }

    /**
     * GET /api/v1/quote-requests/{quoteRequest}
     */
    public function show(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('view', $quoteRequest);

        $quote = $this->quoteRequestService->findOrFail($quoteRequest->id);

        return $this->successResponse(new QuoteRequestResource($quote));
    }

    /**
     * DELETE /api/v1/quote-requests/{quoteRequest}
     */
    public function destroy(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('delete', $quoteRequest);

        $this->quoteRequestService->delete($quoteRequest);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/quote-requests/{quoteRequest}/contact
     */
    public function markContacted(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('update', $quoteRequest);

        $quote = $this->quoteRequestService->markContacted($quoteRequest);

        return $this->successResponse(new QuoteRequestResource($quote), 'Quote request marked as contacted.');
    }

    /**
     * PATCH /api/v1/quote-requests/{quoteRequest}/generate
     */
    public function generateQuote(GenerateQuoteRequest $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('update', $quoteRequest);

        $data = $request->validated();

        $quote = $this->quoteRequestService->generateQuote(
            $quoteRequest,
            $data['vehicle_id'] ?? null,
            $data['admin_notes'] ?? null,
            isset($data['admin_base_price']) ? (float) $data['admin_base_price'] : null,
        );

        return $this->successResponse(new QuoteRequestResource($quote), 'Quote generated successfully.');
    }

    /**
     * PATCH /api/v1/quote-requests/{quoteRequest}/send
     */
    public function sendQuote(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('update', $quoteRequest);

        $quote = $this->quoteRequestService->sendQuote($quoteRequest);

        return $this->successResponse(new QuoteRequestResource($quote), 'Quote sent to customer successfully.');
    }

    /**
     * PATCH /api/v1/quote-requests/{quoteRequest}/convert
     */
    public function convert(ConvertQuoteRequest $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('convert', $quoteRequest);

        $rental = $this->quoteRequestService->convertToRental($quoteRequest, $request->validated());

        return $this->successResponse(new RentalResource($rental), 'Quote converted to rental successfully.');
    }

    /**
     * PATCH /api/v1/quote-requests/{quoteRequest}/mark-converted
     */
    public function markConverted(Request $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('update', $quoteRequest);

        $request->validate(['rental_id' => 'required|exists:rentals,id']);

        $quote = $this->quoteRequestService->markConverted($quoteRequest, $request->string('rental_id'));

        return $this->successResponse(new QuoteRequestResource($quote), 'Quote linked to rental.');
    }

    /**
     * POST /api/v1/quote-requests/{quoteRequest}/resolve
     */
    public function resolve(ResolveQuoteConflictRequest $request, QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('update', $quoteRequest);

        $result = $this->quoteRequestService->resolveConflict($quoteRequest, $request->string('action'));

        $message = $result['status'] === 'converted'
            ? 'Conflict resolved. Rental created successfully.'
            : 'Quote has been cancelled.';

        $data = $result['status'] === 'converted' && isset($result['rental'])
            ? ['rental_reference' => $result['rental']->reference]
            : [];

        return $this->successResponse($data, $message);
    }

    /**
     * GET /api/v1/quote-requests/{quoteRequest}/email-preview
     */
    public function emailPreview(QuoteRequest $quoteRequest): JsonResponse
    {
        $this->authorize('view', $quoteRequest);

        $quote = $this->quoteRequestService->findOrFail($quoteRequest->id);

        if (! $quote->quote_token) {
            return $this->errorResponse('Send the quote to the customer first - the confirmation token has not been generated yet.', 422);
        }

        $frontendUrl = config('app.frontend_url', config('app.url'));
        $confirmUrl = "{$frontendUrl}/confirm-quote/{$quote->quote_token}";
        $cancelUrl = "{$frontendUrl}/confirm-quote/{$quote->quote_token}?cancel=1";

        $pricing = null;
        if ($quote->vehicle && $quote->pickup_date && $quote->return_date) {
            try {
                /** @var PricingServiceInterface $pricingService */
                $pricingService = app(PricingServiceInterface::class);
                $addons = collect($quote->requested_addon_ids ?? [])
                    ->map(fn ($id) => ['id' => $id, 'quantity' => 1])
                    ->all();
                $overrideBaseCost = null;
                if ($quote->admin_base_price !== null) {
                    $days = $pricingService->getRentalDays(
                        $quote->pickup_date->format('Y-m-d'),
                        $quote->return_date->format('Y-m-d')
                    );
                    $overrideBaseCost = round((float) $quote->admin_base_price * $days, 2);
                }
                $pricing = $pricingService->calculate(
                    vehicle: $quote->vehicle,
                    pickupDate: $quote->pickup_date->format('Y-m-d'),
                    returnDate: $quote->return_date->format('Y-m-d'),
                    addons: $addons,
                    pickupLocationId: $quote->pickup_location_id,
                    overrideBaseCost: $overrideBaseCost,
                );
            } catch (Throwable) {
                // Pricing failure should not break the preview
            }
        }

        $html = View::make('emails.quote-ready', [
            'quoteRequest' => $quote,
            'confirmUrl' => $confirmUrl,
            'cancelUrl' => $cancelUrl,
            'expiresAt' => $quote->token_expires_at,
            'pricing' => $pricing,
        ])->render();

        return $this->successResponse(['html' => $html]);
    }
}
