<?php

namespace App\Http\Controllers\V1;

use App\DTOs\AirportBookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignAirportBookingDriverRequest;
use App\Http\Requests\CancelAirportBookingRequest;
use App\Http\Requests\RecordAirportPaymentRequest;
use App\Http\Requests\StoreAirportBookingRequest;
use App\Http\Requests\UpdateAirportBookingRequest;
use App\Http\Resources\AirportBookingCollection;
use App\Http\Resources\AirportBookingResource;
use App\Models\AirportBooking;
use App\Services\Contracts\AirportBookingServiceInterface;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AirportBookingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AirportBookingServiceInterface $bookingService,
    ) {}

    /**
     * GET /api/v1/airport-bookings/blocked-dates?branch_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    public function blockedDates(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'string', 'exists:branches,id'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($request->input('from', today()->toDateString()));
        $to = Carbon::parse($request->input('to', today()->addDays(90)->toDateString()));

        $blocked = $this->bookingService->blockedDates($request->branch_id, $from, $to);

        return $this->successResponse(['blocked_dates' => $blocked]);
    }

    /**
     * GET /api/v1/airport-bookings
     */
    public function index(): JsonResponse
    {
        $bookings = $this->bookingService->getAll();

        return $this->successResponse(new AirportBookingCollection($bookings));
    }

    /**
     * POST /api/v1/airport-bookings
     */
    public function store(StoreAirportBookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->create(
            AirportBookingData::fromRequest($request->validated())
        );

        return $this->createdResponse(new AirportBookingResource($booking), 'Airport booking created successfully.');
    }

    /**
     * GET /api/v1/airport-bookings/{airportBooking}
     */
    public function show(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->getBooking($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking));
    }

    /**
     * PUT /api/v1/airport-bookings/{airportBooking}
     */
    public function update(UpdateAirportBookingRequest $request, AirportBooking $airportBooking): JsonResponse
    {
        $updated = $this->bookingService->update($airportBooking->id, $request->validated());

        return $this->successResponse(new AirportBookingResource($updated), 'Airport booking updated successfully.');
    }

    /**
     * DELETE /api/v1/airport-bookings/{airportBooking}
     */
    public function destroy(AirportBooking $airportBooking): JsonResponse
    {
        $this->bookingService->delete($airportBooking->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/confirm
     */
    public function confirm(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->confirmBooking($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Booking confirmed successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/assign-driver
     */
    public function assignDriver(AssignAirportBookingDriverRequest $request, AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->assignDriver($airportBooking->id, $request->validated());

        return $this->successResponse(new AirportBookingResource($booking), 'Driver assigned successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/remove-driver
     */
    public function removeDriver(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->removeDriver($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Driver removed successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/start-trip
     */
    public function startTrip(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->startTrip($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Trip started successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/complete-trip
     */
    public function completeTrip(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->completeTrip($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Trip completed successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/cancel
     */
    public function cancel(CancelAirportBookingRequest $request, AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->cancelBooking($airportBooking->id, $request->validated());

        return $this->successResponse(new AirportBookingResource($booking), 'Booking cancelled successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/no-show
     */
    public function noShow(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->markNoShow($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Booking marked as no-show.');
    }

    /**
     * POST /api/v1/airport-bookings/{airportBooking}/payment
     */
    public function recordPayment(RecordAirportPaymentRequest $request, AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->recordPayment($airportBooking->id, $request->validated());

        return $this->successResponse(new AirportBookingResource($booking), 'Payment recorded successfully.');
    }

    /**
     * PATCH /api/v1/airport-bookings/{airportBooking}/refund
     */
    public function refund(AirportBooking $airportBooking): JsonResponse
    {
        $booking = $this->bookingService->markRefunded($airportBooking->id);

        return $this->successResponse(new AirportBookingResource($booking), 'Booking marked as refunded.');
    }

    /**
     * POST /api/v1/airport-bookings/{airportBooking}/send-payment-link
     * Email a payment link to the customer.
     */
    public function sendPaymentLink(AirportBooking $airportBooking): JsonResponse
    {
        $this->bookingService->sendPaymentLink($airportBooking->id);

        return $this->successResponse(null, 'Payment link sent successfully.');
    }
}
