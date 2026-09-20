<?php

namespace App\Http\Controllers\V1\Public;

use App\Enums\CustomerIdType;
use App\Enums\CustomerProfileStatus;
use App\Enums\RentalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicCompleteProfileRequest;
use App\Mail\AdminProfileSubmittedMail;
use App\Mail\CustomerProfileSubmittedMail;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\User;
use App\Services\Contracts\PricingServiceInterface;
use App\Settings\PricingSettings;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class CustomerProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PricingServiceInterface $pricingService,
        private readonly PricingSettings $pricingSettings,
    ) {}

    /**
     * GET /api/v1/public/customer/complete-profile/{token}
     * Return the customer's basic info for pre-filling the completion form.
     */
    public function show(string $token): JsonResponse
    {
        $customer = Customer::where('reupload_token', $token)->first();

        if (! $customer) {
            return response()->json(['message' => 'This link is invalid or has already been used.'], 404);
        }

        if ($customer->reupload_token_expires_at->isPast()) {
            return response()->json(['message' => 'This profile completion link has expired. Please contact support.'], 410);
        }

        return $this->successResponse([
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'date_of_birth' => $customer->date_of_birth?->format('Y-m-d'),
        ]);
    }

    /**
     * POST /api/v1/public/customer/complete-profile/{token}
     * Accept full profile details, upload documents, and mark the profile as pending review.
     */
    public function submit(PublicCompleteProfileRequest $request, string $token): JsonResponse
    {
        $customer = Customer::where('reupload_token', $token)->first();

        if (! $customer) {
            return response()->json(['message' => 'This link is invalid or has already been used.'], 404);
        }

        if ($customer->reupload_token_expires_at->isPast()) {
            return response()->json(['message' => 'This profile completion link has expired. Please contact support.'], 410);
        }

        // Check license number uniqueness against other customers
        $licenseConflict = Customer::where('license_number', $request->license_number)
            ->where('id', '!=', $customer->id)
            ->exists();

        if ($licenseConflict) {
            return response()->json([
                'license_conflict' => true,
                'message' => 'This license number is already registered to another account.',
            ], 422);
        }

        $newDob = $request->validated('date_of_birth');
        $dobUpdated = $newDob && empty($customer->date_of_birth);

        // Update customer profile fields
        $customer->update([
            'date_of_birth' => $newDob ?: $customer->date_of_birth,
            'alt_phone' => $request->alt_phone,
            'address' => $request->address,
            'license_number' => $request->license_number,
            'license_expiry_date' => $request->license_expiry_date,
            'id_type' => CustomerIdType::from($request->id_type),
            'id_number' => $request->id_number,
            'id_expiry_date' => $request->id_expiry_date,
            'profile_status' => CustomerProfileStatus::PendingReview,
            'reupload_token' => null,
            'reupload_token_expires_at' => null,
        ]);

        if ($dobUpdated) {
            $this->reconcileDepositAfterDob($customer, $newDob);
        }

        // Upload license image
        $customer->addMediaFromRequest('license_image')
            ->toMediaCollection('license');

        // Upload ID document
        $customer->addMediaFromRequest('id_document')
            ->toMediaCollection('id_document');

        if ($request->hasFile('passport_image')) {
            $customer->addMediaFromRequest('passport_image')
                ->toMediaCollection('passport');
        }

        // Get the rental reference for notification emails
        $latestRental = $customer->rentals()->latest()->first();
        $rentalReference = $latestRental?->reference ?? 'N/A';

        // Send confirmation to customer
        Mail::to($customer->email)->send(
            new CustomerProfileSubmittedMail($customer, $rentalReference)
        );

        // Notify branch managers
        if ($latestRental && $latestRental->branch_id) {
            $managers = User::whereHas(
                'branches',
                fn ($q) => $q->where('branches.id', $latestRental->branch_id)
            )->get();

            foreach ($managers as $manager) {
                Mail::to($manager->email)->send(
                    new AdminProfileSubmittedMail($customer, $rentalReference)
                );
            }
        }

        return $this->successResponse([], 'Profile submitted successfully. Our team will review your details shortly.');
    }

    private function reconcileDepositAfterDob(Customer $customer, string $dateOfBirth): void
    {
        $actualAge = Carbon::parse($dateOfBirth)->age;

        $activeStatuses = [
            RentalStatus::Pending->value,
            RentalStatus::Confirmed->value,
        ];

        $rentals = Rental::where('customer_id', $customer->id)
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('young_driver_override')
            ->with('vehicle.category')
            ->get();

        foreach ($rentals as $rental) {
            $vehicle = $rental->vehicle;

            $threshold = $vehicle->young_driver_age_threshold
                ?? $vehicle->category?->young_driver_age_threshold
                ?? $this->pricingSettings->global_young_driver_age_threshold;

            if ($threshold === null) {
                $rental->update(['young_driver_override' => null]);

                continue;
            }

            $actuallyYoung = $actualAge < $threshold;
            $bracketWasYoung = (bool) $rental->young_driver_override;

            if ($actuallyYoung !== $bracketWasYoung) {
                $newDeposit = $this->pricingService->getDepositAmount(
                    $vehicle,
                    (bool) $rental->skip_security_deposit,
                    $actualAge,
                );

                $depositNote = $actuallyYoung
                    ? "[Auto] Deposit updated to young-driver rate ({$newDeposit}) after customer provided DOB (age {$actualAge}, threshold {$threshold})."
                    : "[Auto] Deposit updated to standard rate ({$newDeposit}) after customer provided DOB (age {$actualAge}, above threshold {$threshold}).";

                $rental->update([
                    'security_deposit_amount' => $newDeposit > 0 ? $newDeposit : null,
                    'young_driver_override' => null,
                    'admin_notes' => trim(($rental->admin_notes ?? '') . "\n" . $depositNote),
                ]);
            } else {
                $rental->update(['young_driver_override' => null]);
            }
        }
    }
}
