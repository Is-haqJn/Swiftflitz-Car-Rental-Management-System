<?php

namespace App\Http\Controllers\V1\Public;

use App\DTOs\RentalData;
use App\Enums\CustomerProfileStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicDirectBookingRequest;
use App\Http\Requests\PublicNewCustomerBookingRequest;
use App\Mail\BookingVerificationMail;
use App\Mail\CustomerProfileCompletionMail;
use App\Models\BookingVerificationToken;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Services\Contracts\RentalServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingVerificationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly RentalServiceInterface $rentalService,
    ) {}

    /**
     * POST /api/v1/public/booking/check-email
     * Silently check whether an email address already belongs to a customer.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        return $this->successResponse([
            'exists' => Customer::where('email', $request->email)->exists(),
        ]);
    }

    /**
     * POST /api/v1/public/booking/book-new
     * Create a minimal customer record + confirmed rental for a first-time customer.
     * A profile-completion email is sent automatically.
     */
    public function bookNew(PublicNewCustomerBookingRequest $request): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($request->vehicle_id);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth ?? null,
            'profile_status' => CustomerProfileStatus::Incomplete,
            'reupload_token' => Str::random(64),
            'reupload_token_expires_at' => now()->addDays(7),
        ]);

        $addons = collect($request->addon_ids ?? [])
            ->map(fn (string $id) => ['id' => $id, 'quantity' => 1])
            ->values()
            ->toArray();

        $rentalData = new RentalData(
            vehicleId: $request->vehicle_id,
            customerId: $customer->id,
            pickupDate: $request->pickup_date,
            returnDate: $request->return_date,
            pickupTime: $request->pickup_time ?? '09:00',
            returnTime: $request->return_time ?? '17:00',
            branchId: $vehicle->branch_id,
            pickupLocationId: $request->pickup_location_id,
            dropoffLocationId: $request->dropoff_location_id,
            addons: $addons,
            customerNotes: $request->customer_notes,
            couponCode: $request->coupon_code,
            source: 'website',
        );

        $rental = $this->rentalService->create($rentalData);

        Mail::to($customer->email)->send(
            new CustomerProfileCompletionMail($customer, $rental->reference)
        );

        return $this->successResponse([
            'rental_id' => $rental->id,
            'rental_reference' => $rental->reference,
            'status' => $rental->status->value,
            'amount' => (float) $rental->total_cost,
            'payer_name' => $customer->name,
            'payer_email' => $customer->email,
            'payer_phone' => $customer->phone,
        ], 'Booking submitted. Profile completion email sent.');
    }

    /**
     * POST /api/v1/public/booking/request-verification
     * Check if email belongs to a known customer and send a verification link.
     */
    public function requestVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if (! $customer) {
            return response()->json([
                'message' => 'No account found with this email. Please use the new customer form.',
            ], 422);
        }

        $sessionId = (string) Str::uuid();
        $token = Str::random(64);

        $verificationToken = BookingVerificationToken::create([
            'token' => $token,
            'session_id' => $sessionId,
            'customer_id' => $customer->id,
            'expires_at' => now()->addMinutes(30),
        ]);

        Mail::to($customer->email)->send(new BookingVerificationMail($verificationToken));

        // Mask email: show first 2 chars + *** before @
        $parts = explode('@', $customer->email);
        $local = $parts[0];
        $domain = $parts[1] ?? '';
        $masked = mb_substr($local, 0, 2) . str_repeat('*', max(1, mb_strlen($local) - 2)) . '@' . $domain;

        return $this->successResponse([
            'session_id' => $sessionId,
            'masked_email' => $masked,
        ], 'Verification email sent.');
    }

    /**
     * GET /api/v1/public/booking/verify-status?session=xxx
     * Polling endpoint - returns whether the session has been verified.
     */
    public function verifyStatus(Request $request): JsonResponse
    {
        $request->validate([
            'session' => ['required', 'string'],
        ]);

        $record = BookingVerificationToken::where('session_id', $request->session)
            ->latest()
            ->first();

        if (! $record || $record->isExpired()) {
            return response()->json(['message' => 'Session not found or expired.'], 404);
        }

        return $this->successResponse([
            'verified' => $record->isVerified(),
            'customer_name' => $record->isVerified() ? ($record->customer->name ?? null) : null,
        ]);
    }

    /**
     * POST /api/v1/public/booking/verify/{token}
     * Called by the frontend verification landing page - marks the token as verified.
     */
    public function confirm(string $token): JsonResponse
    {
        $record = BookingVerificationToken::where('token', $token)
            ->whereNull('used_at')
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or already used verification link.'], 404);
        }

        if ($record->isExpired()) {
            return response()->json(['message' => 'This verification link has expired.'], 410);
        }

        if (! $record->isVerified()) {
            $record->update(['verified_at' => now(), 'used_at' => now()]);
        }

        return $this->successResponse([
            'message' => 'verified',
            'customer_name' => $record->customer->name ?? null,
        ], 'Identity confirmed.');
    }

    /**
     * POST /api/v1/public/booking/book
     * Create a confirmed rental for a verified returning customer.
     */
    public function book(PublicDirectBookingRequest $request): JsonResponse
    {
        $record = BookingVerificationToken::where('session_id', $request->session_id)
            ->latest()
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        if ($record->isExpired()) {
            return response()->json(['message' => 'Session has expired.'], 410);
        }

        if (! $record->isVerified()) {
            return response()->json(['message' => 'Identity not yet verified.'], 422);
        }

        $customer = $record->customer;

        if ($request->date_of_birth && empty($customer->date_of_birth)) {
            $customer->update(['date_of_birth' => $request->date_of_birth]);
        }

        $vehicle = Vehicle::findOrFail($request->vehicle_id);

        $addons = collect($request->addon_ids ?? [])
            ->map(fn (string $id) => ['id' => $id, 'quantity' => 1])
            ->values()
            ->toArray();

        $rentalData = new RentalData(
            vehicleId: $request->vehicle_id,
            customerId: $customer->id,
            pickupDate: $request->pickup_date,
            returnDate: $request->return_date,
            pickupTime: $request->pickup_time ?? '09:00',
            returnTime: $request->return_time ?? '17:00',
            branchId: $vehicle->branch_id,
            pickupLocationId: $request->pickup_location_id,
            dropoffLocationId: $request->dropoff_location_id,
            addons: $addons,
            customerNotes: $request->customer_notes,
            couponCode: $request->coupon_code,
            source: 'website',
        );

        $rental = $this->rentalService->create($rentalData);

        return $this->successResponse([
            'rental_id' => $rental->id,
            'rental_reference' => $rental->reference,
            'status' => $rental->status->value,
            'amount' => (float) $rental->total_cost,
            'payer_name' => $customer->name,
            'payer_email' => $customer->email,
            'payer_phone' => $customer->phone,
        ], 'Booking submitted.');
    }
}
