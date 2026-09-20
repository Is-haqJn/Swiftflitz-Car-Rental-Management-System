<?php

use App\Enums\ChauffeurBookingStatus;
use App\Enums\ChauffeurPaymentStatus;
use App\Jobs\SendChauffeurBookingDocumentJob;
use App\Mail\PaymentConfirmationMail;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\Driver;
use App\Models\FleetServiceAssignment;
use App\Models\FleetVehicle;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/* Helpers */
function chauffeurBookingFixtures(): array
{
    $branch = Branch::factory()->create();
    $vehicle = FleetVehicle::factory()->available()->create();

    FleetServiceAssignment::factory()->chauffeur()->create([
        'vehicle_id' => $vehicle->id,
        'base_price' => 300.00,
        'is_active' => true,
    ]);

    return ['branch' => $branch, 'vehicle' => $vehicle];
}

function validChauffeurBookingPayload(Branch $branch, FleetVehicle $vehicle, array $overrides = []): array
{
    return array_merge([
        'branch_id' => $branch->id,
        'vehicle_id' => $vehicle->id,
        'pickup_time' => now()->addDay()->setTime(9, 0)->toDateTimeString(),
        'return_time' => now()->addDay()->setTime(17, 0)->toDateTimeString(),
        'customer_full_name' => 'Test Customer',
        'customer_phone' => '+233201234567',
    ], $overrides);
}

/* Index */
it('returns a paginated list of chauffeur bookings', function () {
    ChauffeurBooking::factory(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-bookings')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('requires authentication to list chauffeur bookings', function () {
    $this->getJson('/api/v1/chauffeur-bookings')->assertUnauthorized();
});

/* Store */
it('creates a chauffeur booking and generates a CHF reference', function () {
    ['branch' => $branch, 'vehicle' => $vehicle] = chauffeurBookingFixtures();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle))
        ->assertCreated()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::Pending->value);

    expect($response->json('data.booking_reference'))->toStartWith('CHF-');
    expect(ChauffeurBooking::where('branch_id', $branch->id)->exists())->toBeTrue();
});

it('snapshots pricing when creating a chauffeur booking', function () {
    $settings = app(RentalSettings::class);
    $settings->vat_enabled = true;
    $settings->vat_rate = 15.0;
    $settings->save();

    ['branch' => $branch, 'vehicle' => $vehicle] = chauffeurBookingFixtures();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle))
        ->assertCreated();

    expect((float) $response->json('data.base_price_snapshot'))->toBe(300.00);
    expect((float) $response->json('data.total_amount'))->toBeGreaterThan(300.00);
});

it('creates a chauffeur booking with payment details', function () {
    ['branch' => $branch, 'vehicle' => $vehicle] = chauffeurBookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle, [
            'payment_method' => 'cash',
        ]))
        ->assertCreated()
        ->assertJsonPath('data.payment_status', ChauffeurPaymentStatus::Paid->value);
});

it('rejects store when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id', 'vehicle_id', 'pickup_time', 'customer_full_name', 'customer_phone']);
});

it('rejects store when vehicle has no active chauffeur assignment', function () {
    $branch = Branch::factory()->create();
    $vehicle = FleetVehicle::factory()->available()->create();
    // No FleetServiceAssignment created for this vehicle

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle))
        ->assertNotFound();
});

/* Show */
it('returns a single chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/chauffeur-bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $booking->id);
});

it('returns 404 for a non-existent chauffeur booking', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-bookings/00000000-0000-0000-0000-000000000000')
        ->assertNotFound();
});

/* Update */
it('updates staff notes on a chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['staff_notes' => null]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/chauffeur-bookings/{$booking->id}", [
            'staff_notes' => 'VIP customer - handle with care.',
        ])
        ->assertOk()
        ->assertJsonPath('data.staff_notes', 'VIP customer - handle with care.');
});

/* Delete */
it('soft-deletes a chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/chauffeur-bookings/{$booking->id}")
        ->assertNoContent();

    expect(ChauffeurBooking::find($booking->id))->toBeNull();
    expect(ChauffeurBooking::withTrashed()->find($booking->id))->not->toBeNull();
});

/* Confirm */
it('confirms a pending chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['booking_status' => ChauffeurBookingStatus::Pending]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/confirm")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::Confirmed->value);
});

it('rejects confirming a non-pending chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/confirm")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* Assign Driver */
it('assigns a driver to a confirmed chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();
    $driver = Driver::factory()->create(['status' => 'available', 'is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/assign-driver", [
            'driver_id' => $driver->id,
        ])
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::DriverAssigned->value);

    expect($booking->fresh()->driver_id)->toBe($driver->id);
});

it('rejects assigning a driver who is not available', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();
    $driver = Driver::factory()->create(['status' => 'off_duty', 'is_active' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/assign-driver", [
            'driver_id' => $driver->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['driver_id']);
});

/* Remove Driver */
it('removes the driver from a driver-assigned chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->driverAssigned()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/remove-driver")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::Confirmed->value);

    expect($booking->fresh()->driver_id)->toBeNull();
});

it('rejects removing driver from a non-driver-assigned booking', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/remove-driver")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* Start Trip */
it('starts a trip for a confirmed chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/start-trip")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::InProgress->value);

    expect($booking->fresh()->actual_pickup_time)->not->toBeNull();
});

it('rejects starting a trip that is already in progress', function () {
    $booking = ChauffeurBooking::factory()->inProgress()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/start-trip")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* Complete Trip */
it('completes an in-progress chauffeur trip', function () {
    $booking = ChauffeurBooking::factory()->inProgress()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/complete-trip")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::Completed->value);
});

it('rejects completing a trip that is not in progress', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/complete-trip")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* Cancel */
it('cancels a pending chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['booking_status' => ChauffeurBookingStatus::Pending]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/cancel")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::Cancelled->value);

    expect($booking->fresh()->cancelled_at)->not->toBeNull();
});

it('rejects cancelling a completed chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['booking_status' => ChauffeurBookingStatus::Completed]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/cancel")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* No Show */
it('marks a confirmed chauffeur booking as no-show', function () {
    $booking = ChauffeurBooking::factory()->confirmed()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/no-show")
        ->assertOk()
        ->assertJsonPath('data.booking_status', ChauffeurBookingStatus::NoShow->value);
});

it('rejects no-show on a pending chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['booking_status' => ChauffeurBookingStatus::Pending]);

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/chauffeur-bookings/{$booking->id}/no-show")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['booking_status']);
});

/* Record Payment */
it('records a payment on a chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create(['payment_status' => ChauffeurPaymentStatus::Pending]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/payment", [
            'payment_method' => 'cash',
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_status', ChauffeurPaymentStatus::Paid->value);
});

/* Pickup Log */
it('logs pickup for a chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/pickup-log", [
            'pickup_location' => '123 Main Street, Accra',
            'odometer_reading' => 45000,
            'customer_present' => true,
        ])
        ->assertOk();

    expect($booking->fresh()->pickupLog)->not->toBeNull();
    expect($booking->fresh()->pickupLog->pickup_location)->toBe('123 Main Street, Accra');
});

it('rejects a duplicate pickup log', function () {
    $booking = ChauffeurBooking::factory()->create();
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/pickup-log", []);

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/pickup-log", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['pickup_log']);
});

/* Return Log */
it('logs return for a chauffeur booking', function () {
    $booking = ChauffeurBooking::factory()->inProgress()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/return-log", [
            'odometer_reading' => 45250,
            'condition_notes' => 'No issues.',
        ])
        ->assertOk();

    expect($booking->fresh()->returnLog)->not->toBeNull();
    expect($booking->fresh()->actual_return_time)->not->toBeNull();
});

it('rejects a duplicate return log', function () {
    $booking = ChauffeurBooking::factory()->inProgress()->create();
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/return-log", []);

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/chauffeur-bookings/{$booking->id}/return-log", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['return_log']);
});

/* Payment status on creation */
it('keeps payment_status pending when booking is made via website', function () {
    ['vehicle' => $vehicle] = chauffeurBookingFixtures();

    $this->postJson('/api/v1/public/chauffeur-bookings', [
        'vehicle_id' => $vehicle->id,
        'pickup_time' => now()->addDay()->setTime(10, 0)->toDateTimeString(),
        'customer_full_name' => 'Web Customer',
        'customer_phone' => '+233201234567',
    ])->assertCreated();

    $booking = ChauffeurBooking::latest()->first();
    expect($booking->payment_status)->toBe(ChauffeurPaymentStatus::Pending);
});

it('marks payment_status paid when staff records an in-store payment method', function () {
    ['branch' => $branch, 'vehicle' => $vehicle] = chauffeurBookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle, [
            'payment_method' => 'cash',
        ]))
        ->assertCreated()
        ->assertJsonPath('data.payment_status', ChauffeurPaymentStatus::Paid->value);
});

/* FleetVehicle name accessor */
it('returns a non-empty vehicle name from the name accessor', function () {
    $vehicle = FleetVehicle::factory()->create(['make' => 'Toyota', 'model' => 'Camry', 'year' => 2022]);

    expect($vehicle->name)->toBe('2022 Toyota Camry');
});

it('vehicle name accessor includes make and model', function () {
    $vehicle = FleetVehicle::factory()->create(['make' => 'Honda', 'model' => 'Accord', 'year' => 2020]);

    expect($vehicle->name)->toContain('Honda')->toContain('Accord');
});

/* Booking creation sends document to driver only */
it('dispatches chauffeur booking document job to driver only on creation', function () {
    Queue::fake();

    ['branch' => $branch, 'vehicle' => $vehicle] = chauffeurBookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-bookings', validChauffeurBookingPayload($branch, $vehicle, [
            'payment_method' => 'cash',
        ]))
        ->assertCreated();

    Queue::assertPushed(SendChauffeurBookingDocumentJob::class, function ($job) {
        return $job->recipientFilter === 'driver';
    });
});

/* Payment confirmation email attaches receipt PDF for chauffeur bookings */
it('payment confirmation mail attaches a receipt pdf for chauffeur bookings', function () {
    $booking = ChauffeurBooking::factory()->create([
        'payment_status' => ChauffeurPaymentStatus::Paid,
        'payment_method' => 'cash',
    ]);

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'chauffeur_booking',
        'transactable_id' => $booking->id,
        'status' => 'paid',
        'amount' => $booking->total_amount,
    ]);

    $mail = new PaymentConfirmationMail($transaction);
    $attachments = $mail->attachments();

    expect($attachments)->toHaveCount(1);
    expect($attachments[0])->toBeInstanceOf(Attachment::class);
});

/* Payment confirmation mail attaches booking receipt PDF for rental payments */
it('payment confirmation mail attaches booking receipt for rental bookings', function () {
    $rental = Rental::factory()->create();

    $transaction = PaymentTransaction::factory()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'status' => 'paid',
        'amount' => 100.00,
    ]);

    $mail = new PaymentConfirmationMail($transaction);
    $attachments = $mail->attachments();

    expect($attachments)->not->toBeEmpty()
        ->and($attachments)->toHaveCount(1);
});
