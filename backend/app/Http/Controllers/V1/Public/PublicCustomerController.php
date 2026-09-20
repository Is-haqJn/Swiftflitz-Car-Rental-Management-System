<?php

namespace App\Http\Controllers\V1\Public;

use App\Enums\CustomerProfileStatus;
use App\Enums\RentalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicReuploadRequest;
use App\Models\Customer;
use App\Models\Rental;
use App\Services\Contracts\PricingServiceInterface;
use App\Settings\PricingSettings;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class PublicCustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PricingServiceInterface $pricingService,
        private readonly PricingSettings $pricingSettings,
    ) {}

    /**
     * GET /api/v1/public/reupload/{token}
     * Validate token and return customer details for the reupload page.
     */
    public function show(string $token): JsonResponse
    {
        $customer = $this->resolveToken($token);

        return $this->successResponse([
            'name' => $customer->name,
            'date_of_birth' => $customer->date_of_birth?->toDateString(),
            'address' => $customer->address,
            'license_number' => $customer->license_number,
            'license_expiry_date' => $customer->license_expiry_date?->toDateString(),
            'id_type' => $customer->id_type?->value,
            'id_number' => $customer->id_number,
        ]);
    }

    /**
     * POST /api/v1/public/reupload/{token}
     * Customer uploads new documents and updated profile fields via the reupload link.
     */
    public function upload(PublicReuploadRequest $request, string $token): JsonResponse
    {
        $customer = $this->resolveToken($token);

        if ($request->hasFile('license_file')) {
            $customer->clearMediaCollection('license');
            $customer->addMedia($request->file('license_file'))->toMediaCollection('license');
        }

        if ($request->hasFile('id_document_file')) {
            $customer->clearMediaCollection('id_document');
            $customer->addMedia($request->file('id_document_file'))->toMediaCollection('id_document');
        }

        $dobUpdated = false;
        $newDob = $request->validated('date_of_birth');

        if ($newDob && empty($customer->date_of_birth)) {
            $dobUpdated = true;
        }

        $customer->update([
            'date_of_birth' => $newDob ?: $customer->date_of_birth,
            'address' => $request->validated('address'),
            'license_number' => $request->validated('license_number'),
            'license_expiry_date' => $request->validated('license_expiry_date'),
            'id_type' => $request->validated('id_type'),
            'id_number' => $request->validated('id_number'),
            'profile_status' => CustomerProfileStatus::PendingReview->value,
            'reupload_token' => null,
            'reupload_token_expires_at' => null,
        ]);

        if ($dobUpdated) {
            $this->reconcileDepositAfterDob($customer, $newDob);
        }

        return $this->successResponse(
            null,
            'Documents received. Our team will verify them shortly.'
        );
    }

    /**
     * When a customer provides their real DOB for the first time,
     * compare it against any pending/confirmed rentals where admin
     * set an age bracket override. Update deposit if there is a mismatch.
     */
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
                /* Deposit amount changes - recalculate and flag admin */
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
                /* Bracket matched real DOB - just clear the override */
                $rental->update(['young_driver_override' => null]);
            }
        }
    }

    private function resolveToken(string $token): Customer
    {
        $customer = Customer::where('reupload_token', $token)->first();

        abort_unless($customer, 404, 'Invalid or expired reupload link.');

        abort_if(
            $customer->reupload_token_expires_at && $customer->reupload_token_expires_at->isPast(),
            410,
            'This reupload link has expired. Please request a new one from our team.'
        );

        return $customer;
    }
}
