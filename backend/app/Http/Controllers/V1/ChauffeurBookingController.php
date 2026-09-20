<?php

namespace App\Http\Controllers\V1;

use App\DTOs\ChauffeurBookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignChauffeurDriverRequest;
use App\Http\Requests\CancelChauffeurBookingRequest;
use App\Http\Requests\RecordChauffeurPaymentRequest;
use App\Http\Requests\StoreChauffeurBookingRequest;
use App\Http\Requests\StoreChauffeurPickupLogRequest;
use App\Http\Requests\StoreChauffeurReturnLogRequest;
use App\Http\Requests\UpdateChauffeurBookingRequest;
use App\Http\Resources\ChauffeurBookingCollection;
use App\Http\Resources\ChauffeurBookingResource;
use App\Models\ChauffeurBooking;
use App\Models\FleetVehicle;
use App\Services\Contracts\ChauffeurBookingServiceInterface;
use App\Services\Contracts\VehicleAvailabilityServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChauffeurBookingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChauffeurBookingServiceInterface $bookingService,
        protected VehicleAvailabilityServiceInterface $vehicleAvailability,
    ) {}

    /**
     * GET /api/v1/chauffeur-bookings
     */
    public function index(): JsonResponse
    {
        $bookings = $this->bookingService->getAll();

        return $this->successResponse(new ChauffeurBookingCollection($bookings));
    }

    /**
     * POST /api/v1/chauffeur-bookings
     */
    public function store(StoreChauffeurBookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->create(
            ChauffeurBookingData::fromRequest($request->validated())
        );

        return $this->createdResponse(new ChauffeurBookingResource($booking), 'Chauffeur booking created successfully.');
    }

    /**
     * GET /api/v1/chauffeur-bookings/{chauffeurBooking}
     */
    public function show(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->getBooking($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking));
    }

    /**
     * PUT /api/v1/chauffeur-bookings/{chauffeurBooking}
     */
    public function update(UpdateChauffeurBookingRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $updated = $this->bookingService->update($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($updated), 'Chauffeur booking updated successfully.');
    }

    /**
     * DELETE /api/v1/chauffeur-bookings/{chauffeurBooking}
     */
    public function destroy(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $this->bookingService->delete($chauffeurBooking->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/confirm
     */
    public function confirm(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->confirmBooking($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Booking confirmed successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/assign-driver
     */
    public function assignDriver(AssignChauffeurDriverRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->assignDriver($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Driver assigned successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/remove-driver
     */
    public function removeDriver(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->removeDriver($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Driver removed successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/start-trip
     */
    public function startTrip(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->startTrip($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Trip started successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/complete-trip
     */
    public function completeTrip(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->completeTrip($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Trip completed successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/cancel
     */
    public function cancel(CancelChauffeurBookingRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->cancelBooking($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Booking cancelled successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/no-show
     */
    public function noShow(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->markNoShow($chauffeurBooking->id);

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Booking marked as no-show.');
    }

    /**
     * POST /api/v1/chauffeur-bookings/{chauffeurBooking}/payment
     */
    public function recordPayment(RecordChauffeurPaymentRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->recordPayment($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Payment recorded successfully.');
    }

    /**
     * PATCH /api/v1/chauffeur-bookings/{chauffeurBooking}/refund
     *
     * Body: { action: 'approve'|'waive', note?: string }
     */
    public function refund(Request $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:approve,waive'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['action'] === 'approve') {
            $booking = $this->bookingService->approveRefund($chauffeurBooking->id, $data['note'] ?? null);
            $message = 'Refund approved and customer notified.';
        } else {
            $booking = $this->bookingService->waiveRefund($chauffeurBooking->id, $data['note'] ?? null);
            $message = 'Refund waived.';
        }

        return $this->successResponse(new ChauffeurBookingResource($booking), $message);
    }

    /**
     * POST /api/v1/chauffeur-bookings/{chauffeurBooking}/pickup-log
     */
    public function logPickup(StoreChauffeurPickupLogRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->logPickup($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Pickup log recorded successfully.');
    }

    /**
     * POST /api/v1/chauffeur-bookings/{chauffeurBooking}/return-log
     */
    public function logReturn(StoreChauffeurReturnLogRequest $request, ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $booking = $this->bookingService->logReturn($chauffeurBooking->id, $request->validated());

        return $this->successResponse(new ChauffeurBookingResource($booking), 'Return log recorded successfully.');
    }

    /**
     * POST /api/v1/chauffeur-bookings/{chauffeurBooking}/send-payment-link
     * Email a payment link to the customer.
     */
    public function sendPaymentLink(ChauffeurBooking $chauffeurBooking): JsonResponse
    {
        $this->bookingService->sendPaymentLink($chauffeurBooking->id);

        return $this->successResponse(null, 'Payment link sent successfully.');
    }

    /**
     * GET /api/v1/chauffeur-bookings/vehicle/{vehicle}/booked-dates
     * Return active booking intervals for a vehicle so the admin calendar can grey out those dates.
     */
    public function vehicleBookedDates(FleetVehicle $vehicle): JsonResponse
    {
        $intervals = $this->vehicleAvailability->getBookedIntervals($vehicle->id);

        return $this->successResponse($intervals->values()->all());
    }
}
