<?php

namespace App\Http\Controllers\V1\Public;

use App\DTOs\ChauffeurBookingData;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicBookChauffeurRequest;
use App\Models\ChauffeurCustomer;
use App\Models\FleetVehicle;
use App\Services\Contracts\ChauffeurBookingServiceInterface;
use App\Services\Contracts\VehicleAvailabilityServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChauffeurController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ChauffeurBookingServiceInterface $bookingService,
        protected VehicleAvailabilityServiceInterface $vehicleAvailability,
    ) {}

    /**
     * GET /api/v1/public/chauffeur-vehicles/{vehicle}/booked-dates
     * Return active booking intervals for a vehicle so the frontend can grey out those dates.
     */
    public function bookedDates(FleetVehicle $vehicle): JsonResponse
    {
        $intervals = $this->vehicleAvailability->getBookedIntervals($vehicle->id);

        return $this->successResponse($intervals->values()->all());
    }

    /**
     * GET /api/v1/public/chauffeur/check-customer?email=xxx
     * Check whether an email already exists as a chauffeur customer.
     * Always returns 200 - no 404.
     */
    public function checkCustomer(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $customer = ChauffeurCustomer::where('email', $request->email)->first();

        return $this->successResponse([
            'exists' => $customer !== null,
            'full_name' => $customer?->full_name,
            'phone' => $customer?->phone,
        ]);
    }

    /**
     * POST /api/v1/public/chauffeur-bookings
     * Create a chauffeur booking from the public website.
     * branch_id is resolved from the vehicle; payment is assumed paid.
     */
    public function book(PublicBookChauffeurRequest $request): JsonResponse
    {
        $vehicle = FleetVehicle::findOrFail($request->vehicle_id);

        $data = new ChauffeurBookingData(
            branchId: $vehicle->branch_id,
            vehicleId: $request->vehicle_id,
            driverId: null,
            pickupLocationId: $request->pickup_location_id ?? null,
            pickupTime: $request->pickup_time,
            returnTime: null,
            customerFullName: $request->customer_full_name,
            customerEmail: $request->customer_email ?? null,
            customerPhone: $request->customer_phone,
            expectedDestination: $request->expected_destination ?? null,
            paymentMethod: 'website',
            paymentReference: null,
            staffNotes: null,
            couponCode: $request->coupon_code ?? null,
        );

        $booking = $this->bookingService->create($data);

        return $this->successResponse(
            [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'amount' => (float) ($booking->total_amount ?? 0),
                'payer_name' => $booking->customer_full_name,
                'payer_email' => $booking->customer_email,
                'payer_phone' => $booking->customer_phone,
            ],
            'Booking created successfully.',
            201
        );
    }
}
