<?php

namespace App\Services;

use App\DTOs\QuoteRequestData;
use App\DTOs\RentalData;
use App\Enums\CustomerProfileStatus;
use App\Enums\QuoteRequestStatus;
use App\Enums\RentalPaymentStatus;
use App\Enums\RentalStatus;
use App\Events\QuoteRequestSubmitted;
use App\Mail\QuoteReadyMail;
use App\Models\Customer;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Repositories\Contracts\QuoteRequestRepositoryInterface;
use App\Services\Contracts\QuoteRequestServiceInterface;
use App\Services\Contracts\RentalServiceInterface;
use App\Settings\PricingSettings;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class QuoteRequestService implements QuoteRequestServiceInterface
{
    public function __construct(
        protected QuoteRequestRepositoryInterface $repository,
        protected RentalServiceInterface $rentalService,
        protected PricingSettings $pricingSettings,
    ) {}

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->getAll($perPage);
    }

    public function findOrFail(string $id): QuoteRequest
    {
        return $this->repository->findWithRelations($id);
    }

    public function create(QuoteRequestData $data): QuoteRequest
    {
        $this->syncCustomerDateOfBirth($data->email, $data->dateOfBirth);

        $quote = $this->repository->createQuote(array_merge(
            $data->toArray(),
            [
                'reference' => $this->repository->generateReference(),
                'status' => QuoteRequestStatus::Pending->value,
            ]
        ));

        $quote->load(['vehicle', 'customer']);

        QuoteRequestSubmitted::dispatch($quote);

        return $quote;
    }

    public function markContacted(QuoteRequest $quote): QuoteRequest
    {
        return $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::Contacted->value,
            'contacted_at' => now(),
        ]);
    }

    public function generateQuote(QuoteRequest $quote, ?string $vehicleId, ?string $adminNotes, ?float $adminBasePrice = null): QuoteRequest
    {
        $expiryHours = $this->pricingSettings->quote_expiry_hours;

        $updates = [
            'status' => QuoteRequestStatus::Quoted->value,
            'quoted_at' => now(),
            'quote_token' => bin2hex(random_bytes(32)),
            'token_expires_at' => now()->addHours($expiryHours),
        ];

        if ($vehicleId) {
            $updates['vehicle_id'] = $vehicleId;
        }

        if (! is_null($adminNotes)) {
            $updates['admin_notes'] = $adminNotes;
        }

        if (! is_null($adminBasePrice)) {
            $updates['admin_base_price'] = $adminBasePrice;
        }

        $this->repository->updateQuote($quote, $updates);

        return $this->repository->findWithRelations($quote->id);
    }

    /**
     * Book a confirmed rental for a returning customer directly from their quote link.
     * The quote must already have customer_id set and be in 'sent' status.
     *
     * @return array{status: string, rental: Rental}
     */
    public function bookReturning(QuoteRequest $quote, ?string $altPhone = null): array
    {
        abort_unless($quote->customer_id, 422, 'No customer is linked to this quote.');
        abort_unless($quote->vehicle_id, 422, 'No vehicle has been assigned to this quote.');
        abort_unless($quote->pickup_date && $quote->return_date, 422, 'This quote does not have confirmed rental dates.');

        // Update alt_phone if the customer doesn't have one yet
        if ($altPhone) {
            $customer = Customer::find($quote->customer_id);
            if ($customer && empty($customer->alt_phone)) {
                $customer->update(['alt_phone' => $altPhone]);
            }
        }

        $rental = $this->createRentalFromQuote($quote, $quote->customer_id, []);

        return ['status' => 'converted', 'rental' => $rental];
    }

    public function sendQuote(QuoteRequest $quote): QuoteRequest
    {
        $expiryHours = $this->pricingSettings->quote_expiry_hours;

        $tokenUpdates = [
            'status' => QuoteRequestStatus::Sent->value,
            'token_expires_at' => now()->addHours($expiryHours),
            'sent_at' => now(),
        ];

        // Token is generated at the generate-quote step; only create one here if missing
        if (! $quote->quote_token) {
            $tokenUpdates['quote_token'] = bin2hex(random_bytes(32));
        }

        $updated = $this->repository->updateQuote($quote, $tokenUpdates);

        $updated->load(['vehicle']);

        if ($updated->email) {
            Mail::to($updated->email)->queue(new QuoteReadyMail($updated));
        }

        return $updated;
    }

    public function getByToken(string $token): QuoteRequest
    {
        $quote = $this->repository->findByToken($token);

        if (! $quote) {
            abort(404, 'Quote not found.');
        }

        if ($quote->status === QuoteRequestStatus::Cancelled) {
            abort(409, 'This quote has been cancelled.');
        }

        if ($quote->status === QuoteRequestStatus::Converted) {
            $rental = $quote->converted_rental_id
                ? Rental::with('customer')->find($quote->converted_rental_id)
                : null;

            $isPaid = $rental && (
                $rental->payment_status === RentalPaymentStatus::Paid
                || $rental->payment_status === RentalPaymentStatus::Refunded
            );

            if ($rental && ! $isPaid) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Booking created - payment pending.',
                        'type' => 'payment_pending',
                        'rental_id' => $rental->id,
                        'rental_reference' => $rental->reference,
                        'payer_name' => $rental->customer?->name,
                        'payer_email' => $rental->customer?->email,
                        'payer_phone' => $rental->customer?->phone,
                        'amount' => (float) $rental->total_cost,
                    ], 409)
                );
            }

            abort(409, 'This quote has already been converted.');
        }

        if ($quote->token_expires_at && $quote->token_expires_at->isPast()) {
            abort(410, 'This quote link has expired.');
        }

        return $quote;
    }

    public function convertToRental(QuoteRequest $quote, array $payload): Rental
    {
        $rentalData = new RentalData(
            vehicleId: $quote->vehicle_id,
            customerId: $payload['customer_id'],
            pickupDate: $quote->pickup_date?->format('Y-m-d') ?? $quote->expected_pickup_date?->format('Y-m-d'),
            returnDate: $quote->return_date?->format('Y-m-d'),
            branchId: $quote->branch_id,
            pickupTime: $payload['pickup_time'] ?? '09:00',
            returnTime: $payload['return_time'] ?? '17:00',
            source: 'quote_request',
            pickupLocationId: $quote->pickup_location_id,
            dropoffLocationId: $payload['dropoff_location_id'] ?? null,
            initialPayment: (float) ($payload['amount_paid'] ?? 0),
            adminNotes: $payload['admin_notes'] ?? $quote->admin_notes,
            customerNotes: $quote->message,
        );

        $rental = $this->rentalService->create($rentalData);

        $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::Converted->value,
            'converted_rental_id' => $rental->id,
            'confirmed_at' => now(),
        ]);

        return $rental;
    }

    public function confirmByCustomer(QuoteRequest $quote, array $payload): array
    {
        if (! $quote->vehicle_id) {
            abort(422, 'No vehicle has been assigned to this quote. Please contact us.');
        }

        if (! $quote->pickup_date || ! $quote->return_date) {
            abort(422, 'This quote does not have confirmed rental dates. Please contact us to finalise your booking dates.');
        }

        $submittedLicense = $payload['license_number'] ?? null;

        // 1. Look up by email
        $customerByEmail = Customer::where('email', $payload['customer_email'])->first();

        if (! $customerByEmail) {
            // Email not found - check if the submitted license belongs to another account
            $customerByLicense = $submittedLicense
                ? Customer::where('license_number', $submittedLicense)->first()
                : null;

            if ($customerByLicense) {
                // Scenario C - license registered to a different email
                return $this->flagConflict($quote, $payload, 'license_registered', $customerByLicense);
            }

            // No conflict - create new customer
            $hasFiles = ! empty($payload['license_file']) || ! empty($payload['id_document_file']);

            $customer = Customer::create([
                'name' => $payload['customer_name'],
                'email' => $payload['customer_email'],
                'phone' => $payload['customer_phone'],
                'alt_phone' => $payload['customer_alt_phone'] ?? null,
                'address' => $payload['customer_address'] ?? null,
                'date_of_birth' => $payload['customer_date_of_birth'] ?? null,
                'license_number' => $submittedLicense,
                'license_expiry_date' => $payload['license_expiry_date'] ?? null,
                'id_type' => $payload['id_type'] ?? null,
                'id_number' => $payload['id_number'] ?? null,
                'id_expiry_date' => $payload['id_expiry_date'] ?? null,
                'profile_status' => $hasFiles
                    ? CustomerProfileStatus::PendingReview->value
                    : CustomerProfileStatus::Incomplete->value,
            ]);
        } else {
            // Email found - check license match
            $existingLicense = $customerByEmail->license_number;

            if ($existingLicense && $submittedLicense && $existingLicense !== $submittedLicense) {
                // Scenario B - same email, different license
                return $this->flagConflict($quote, $payload, 'license_mismatch', $customerByEmail);
            }

            // Scenario A - returning customer, update blank fields
            $updates = array_filter([
                'phone' => empty($customerByEmail->phone) ? ($payload['customer_phone'] ?? null) : null,
                'alt_phone' => empty($customerByEmail->alt_phone) ? ($payload['customer_alt_phone'] ?? null) : null,
                'address' => empty($customerByEmail->address) ? ($payload['customer_address'] ?? null) : null,
                'date_of_birth' => empty($customerByEmail->date_of_birth) ? ($payload['customer_date_of_birth'] ?? null) : null,
                'license_number' => empty($customerByEmail->license_number) ? ($submittedLicense ?? null) : null,
                'license_expiry_date' => empty($customerByEmail->license_expiry_date) ? ($payload['license_expiry_date'] ?? null) : null,
                'id_type' => empty($customerByEmail->id_type) ? ($payload['id_type'] ?? null) : null,
                'id_number' => empty($customerByEmail->id_number) ? ($payload['id_number'] ?? null) : null,
                'id_expiry_date' => empty($customerByEmail->id_expiry_date) ? ($payload['id_expiry_date'] ?? null) : null,
            ]);

            if (! empty($updates)) {
                $customerByEmail->update($updates);
            }

            $customer = $customerByEmail;
        }

        // 2. Upload documents to customer
        if (! empty($payload['license_file'])) {
            $customer->clearMediaCollection('license');
            $customer->addMedia($payload['license_file'])->toMediaCollection('license');
        }
        if (! empty($payload['id_document_file'])) {
            $customer->clearMediaCollection('id_document');
            $customer->addMedia($payload['id_document_file'])->toMediaCollection('id_document');
        }

        // Mark profile as pending review if docs were submitted
        if (! empty($payload['license_file']) || ! empty($payload['id_document_file'])) {
            $customer->update(['profile_status' => CustomerProfileStatus::PendingReview->value]);
        }

        // 3. Create rental + confirm quote
        $rental = $this->createRentalFromQuote($quote, $customer->id, $payload);

        return ['status' => 'converted', 'rental' => $rental];
    }

    public function resolveConflict(QuoteRequest $quote, string $action): array
    {
        abort_unless(
            $quote->status === QuoteRequestStatus::PendingReview,
            422,
            'Quote is not in pending review.'
        );

        abort_unless($quote->conflicting_customer_id, 422, 'No conflicting customer reference found.');

        $conflictingCustomer = Customer::findOrFail($quote->conflicting_customer_id);
        $pendingData = $quote->pending_customer_data ?? [];

        if ($action === 'reject') {
            // Clear pending data + delete pending docs + cancel quote
            $quote->clearMediaCollection('pending_documents');
            $this->repository->updateQuote($quote, [
                'status' => QuoteRequestStatus::Cancelled->value,
                'pending_customer_data' => null,
                'conflict_type' => null,
                'conflicting_customer_id' => null,
            ]);

            return ['status' => 'cancelled'];
        }

        if ($action === 'update_and_proceed') {
            // Scenario B - update existing customer's license, then create rental
            $conflictingCustomer->update([
                'license_number' => $pendingData['license_number'] ?? $conflictingCustomer->license_number,
                'license_expiry_date' => $pendingData['license_expiry_date'] ?? $conflictingCustomer->license_expiry_date,
                'profile_status' => CustomerProfileStatus::PendingReview->value,
            ]);

            $this->movePendingDocumentsToCustomer($quote, $conflictingCustomer);

            $rental = $this->createRentalFromQuote($quote, $conflictingCustomer->id, $pendingData);

            return ['status' => 'converted', 'rental' => $rental];
        }

        if ($action === 'merge_and_proceed') {
            // Scenario C - link existing customer (by license), add new docs, create rental
            $updates = array_filter([
                'alt_phone' => empty($conflictingCustomer->alt_phone) ? ($pendingData['customer_alt_phone'] ?? null) : null,
                'address' => empty($conflictingCustomer->address) ? ($pendingData['customer_address'] ?? null) : null,
                'date_of_birth' => empty($conflictingCustomer->date_of_birth) ? ($pendingData['customer_date_of_birth'] ?? null) : null,
                'id_expiry_date' => empty($conflictingCustomer->id_expiry_date) ? ($pendingData['id_expiry_date'] ?? null) : null,
                'profile_status' => CustomerProfileStatus::PendingReview->value,
            ]);

            $conflictingCustomer->update($updates);

            $this->movePendingDocumentsToCustomer($quote, $conflictingCustomer);

            $rental = $this->createRentalFromQuote($quote, $conflictingCustomer->id, $pendingData);

            return ['status' => 'converted', 'rental' => $rental];
        }

        abort(422, 'Invalid action.');
    }

    public function markConverted(QuoteRequest $quote, string $rentalId): QuoteRequest
    {
        return $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::Converted->value,
            'converted_rental_id' => $rentalId,
            'confirmed_at' => now(),
        ]);
    }

    public function cancel(QuoteRequest $quote): QuoteRequest
    {
        return $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::Cancelled->value,
        ]);
    }

    public function delete(QuoteRequest $quote): bool
    {
        return $this->repository->deleteQuote($quote);
    }

    /**
     * Update an existing customer's DOB when they don't already have one set.
     * No-op when no customer with that email exists yet - DOB will be captured
     * at quote confirmation time via the booking form.
     */
    private function syncCustomerDateOfBirth(string $email, ?string $dateOfBirth): void
    {
        if (! $dateOfBirth) {
            return;
        }

        $existing = Customer::where('email', $email)->first();

        if ($existing && empty($existing->date_of_birth)) {
            $existing->update(['date_of_birth' => $dateOfBirth]);
        }
    }

    /**
     * Store conflict data on the quote and set it to pending_review.
     *
     * @return array{status: string, conflict_type: string}
     */
    private function flagConflict(QuoteRequest $quote, array $payload, string $conflictType, Customer $conflictingCustomer): array
    {
        // Store all submitted form data (no files - those go to media)
        $pendingData = [
            'customer_name' => $payload['customer_name'] ?? null,
            'customer_phone' => $payload['customer_phone'] ?? null,
            'customer_alt_phone' => $payload['customer_alt_phone'] ?? null,
            'customer_address' => $payload['customer_address'] ?? null,
            'customer_date_of_birth' => $payload['customer_date_of_birth'] ?? null,
            'license_number' => $payload['license_number'] ?? null,
            'license_expiry_date' => $payload['license_expiry_date'] ?? null,
            'id_type' => $payload['id_type'] ?? null,
            'id_number' => $payload['id_number'] ?? null,
            'id_expiry_date' => $payload['id_expiry_date'] ?? null,
            'pickup_time' => $payload['pickup_time'] ?? '09:00',
            'return_time' => $payload['return_time'] ?? '09:00',
            'dropoff_location_id' => $payload['dropoff_location_id'] ?? null,
            'customer_notes' => $payload['customer_notes'] ?? null,
        ];

        // Upload submitted files to the quote's pending_documents collection
        if (! empty($payload['license_file'])) {
            $quote->addMedia($payload['license_file'])
                ->withCustomProperties(['document_type' => 'license'])
                ->toMediaCollection('pending_documents');
        }
        if (! empty($payload['id_document_file'])) {
            $quote->addMedia($payload['id_document_file'])
                ->withCustomProperties(['document_type' => 'id_document'])
                ->toMediaCollection('pending_documents');
        }

        $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::PendingReview->value,
            'pending_customer_data' => $pendingData,
            'conflict_type' => $conflictType,
            'conflicting_customer_id' => $conflictingCustomer->id,
        ]);

        return ['status' => 'pending_review', 'conflict_type' => $conflictType];
    }

    /**
     * Move all pending_documents from quote to the customer's license/id_document collections.
     *
     * Uses an explicit path-based approach instead of Spatie's copy() to avoid URL-resolution
     * failures when the media disk is not publicly accessible during the request lifecycle.
     */
    private function movePendingDocumentsToCustomer(QuoteRequest $quote, Customer $customer): void
    {
        foreach ($quote->getMedia('pending_documents') as $media) {
            $docType = $media->getCustomProperty('document_type', 'license');
            $collection = in_array($docType, ['license', 'id_document']) ? $docType : 'license';

            $sourcePath = $media->getPath();

            if (! file_exists($sourcePath) || filesize($sourcePath) === 0) {
                Log::warning("Pending document file missing or empty, skipping: {$sourcePath}");

                continue;
            }

            $customer->clearMediaCollection($collection);

            $customer->addMedia($sourcePath)
                ->preservingOriginal()
                ->withCustomProperties(['document_type' => $docType])
                ->toMediaCollection($collection);

            $media->delete();
        }
    }

    /**
     * Build RentalData from a quote + payload and persist it as Confirmed.
     */
    private function createRentalFromQuote(QuoteRequest $quote, string $customerId, array $payload): Rental
    {
        // Compute base cost override: admin_base_price is stored as per-day rate
        $overrideBaseCost = null;
        if ($quote->admin_base_price !== null && $quote->pickup_date && $quote->return_date) {
            $rentalDays = (int) $quote->pickup_date->diffInDays($quote->return_date);
            if ($rentalDays > 0) {
                $overrideBaseCost = round((float) $quote->admin_base_price * $rentalDays, 2);
            }
        }

        // Map requested addon IDs to [{id, quantity: 1}] format
        $addons = collect($quote->requested_addon_ids ?? [])
            ->map(fn ($id) => ['id' => $id, 'quantity' => 1])
            ->all();

        $rentalData = new RentalData(
            vehicleId: $quote->vehicle_id,
            customerId: $customerId,
            pickupDate: $quote->pickup_date?->format('Y-m-d') ?? $quote->expected_pickup_date?->format('Y-m-d'),
            returnDate: $quote->return_date?->format('Y-m-d'),
            branchId: $quote->branch_id,
            pickupTime: $payload['pickup_time'] ?? '09:00',
            returnTime: $payload['return_time'] ?? '09:00',
            source: 'quote_request',
            pickupLocationId: $quote->pickup_location_id,
            dropoffLocationId: $payload['dropoff_location_id'] ?? null,
            addons: $addons,
            overrideBaseCost: $overrideBaseCost,
            customerNotes: $payload['customer_notes'] ?? $quote->message,
        );

        $rental = $this->rentalService->create($rentalData);
        $rental->refresh();

        $customer = Customer::find($customerId);
        if ($customer?->profile_status === CustomerProfileStatus::Verified) {
            $rental->update([
                'status' => RentalStatus::Confirmed->value,
            ]);
        }

        $this->repository->updateQuote($quote, [
            'status' => QuoteRequestStatus::Converted->value,
            'customer_id' => $customerId,
            'converted_rental_id' => $rental->id,
            'confirmed_at' => now(),
            'pending_customer_data' => null,
            'conflict_type' => null,
            'conflicting_customer_id' => null,
        ]);

        return $rental->refresh();
    }
}
