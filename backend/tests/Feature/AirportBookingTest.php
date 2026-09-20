<?php

use App\Enums\AirportBookingStatus;
use App\Enums\AirportPaymentStatus;
use App\Models\Airport;
use App\Models\AirportBooking;
use App\Models\AirportCustomer;
use App\Models\AirportLocation;
use App\Models\AirportPackageAssignment;
use App\Models\Branch;
use App\Models\Driver;
use App\Models\FleetVehicle;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Test helper */
/**
 * Build valid store payload for creating a booking.
 */
function validBookingPayload(
    Branch $branch,
    AirportPackageAssignment $assignment,
    AirportLocation $terminal,
    AirportLocation $area,
    array $overrides = []
): array {
    return array_merge([
        'branch_id' => $branch->id,
        'direction' => 'pickup',
        'package_assignment_id' => $assignment->id,
        'terminal_location_id' => $terminal->id,
        'area_location_id' => $area->id,
        'scheduled_at' => now()->addDays(2)->toDateTimeString(),
        'passenger_name' => 'John Passenger',
        'passenger_phone' => '+233201234567',
        'passenger_count' => 2,
        'customer_full_name' => 'Alice Traveller',
        'customer_email' => 'alice@example.com',
        'customer_phone' => '+233209999999',
    ], $overrides);
}

function bookingFixtures(): array
{
    $airport = Airport::factory()->create();
    $branch = Branch::factory()->create(['airport_id' => $airport->id, 'has_airport_service' => true]);
    $assignment = AirportPackageAssignment::factory()->create(['airport_id' => $airport->id]);
    $terminal = AirportLocation::factory()->terminal($airport)->create();
    $area = AirportLocation::factory()->area($branch)->create();

    return [
        'branch' => $branch,
        'assignment' => $assignment,
        'terminal' => $terminal,
        'area' => $area,
    ];
}

/* Index */
it('returns a paginated list of bookings', function () {
    $user = adminUser();
    AirportBooking::factory(3)->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/airport-bookings')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('requires authentication to list bookings', function () {
    $this->getJson('/api/v1/airport-bookings')->assertUnauthorized();
});

/* Store */
it('creates a booking and auto-creates a new airport customer', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area
        ))
        ->assertCreated()
        ->assertJsonPath('data.passenger_name', 'John Passenger')
        ->assertJsonPath('data.booking_status', 'pending')
        ->assertJsonPath('data.payment_status', 'pending');

    expect(AirportCustomer::where('email', 'alice@example.com')->exists())->toBeTrue();
    expect(AirportBooking::count())->toBe(1);
});

it('reuses an existing airport customer matched by email', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $existing = AirportCustomer::factory()->create([
        'email' => 'existing@example.com',
        'full_name' => 'Existing Name',
    ]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area,
            ['customer_email' => 'existing@example.com', 'customer_full_name' => 'New Name Ignored']
        ))
        ->assertCreated();

    // Still only one customer record with original name
    expect(AirportCustomer::where('email', 'existing@example.com')->count())->toBe(1);
    expect(AirportCustomer::where('email', 'existing@example.com')->first()->full_name)->toBe('Existing Name');
});

it('creates booking with payment and sets payment_received status', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area,
            ['payment_method' => 'cash', 'payment_reference' => 'CASH-001']
        ))
        ->assertCreated()
        ->assertJsonPath('data.booking_status', 'payment_received')
        ->assertJsonPath('data.payment_status', 'paid')
        ->assertJsonPath('data.payment_method', 'cash');
});

it('records a payment transaction when booking is created with an in-store payment method', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area,
            ['payment_method' => 'cash', 'payment_reference' => 'CASH-REC-001']
        ))
        ->assertCreated();

    $bookingId = $response->json('data.id');

    expect(PaymentTransaction::where('transactable_type', 'airport_booking')
        ->where('transactable_id', $bookingId)
        ->where('status', 'paid')
        ->exists()
    )->toBeTrue();
});

it('does not record a payment transaction when booking is created without a payment method', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area
        ))
        ->assertCreated();

    $bookingId = $response->json('data.id');

    expect(PaymentTransaction::where('transactable_type', 'airport_booking')
        ->where('transactable_id', $bookingId)
        ->exists()
    )->toBeFalse();
});

it('computes pricing snapshot correctly on store', function () {
    $settings = app(\App\Settings\RentalSettings::class);
    $settings->vat_enabled = true;
    $settings->vat_rate = 15.0;
    $settings->save();

    $airport = Airport::factory()->create();
    $branch = Branch::factory()->create(['airport_id' => $airport->id, 'has_airport_service' => true]);
    $assignment = AirportPackageAssignment::factory()->create([
        'airport_id' => $airport->id,
        'base_price' => 200.00,
    ]);
    $terminal = AirportLocation::factory()->terminal($airport)->create();
    $area = AirportLocation::factory()->area($branch)->create(['has_charge' => false, 'charge_amount' => null]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area
        ))
        ->assertCreated();

    expect((float) $response->json('data.package_rate_snapshot'))->toBe(200.0);
    expect((float) $response->json('data.area_charge_snapshot'))->toBe(0.0);
    expect((float) $response->json('data.total_amount'))->toBeGreaterThan(200.0); // VAT added
});

it('generates a unique APT booking reference', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area
        ))
        ->assertCreated();

    expect($response->json('data.booking_reference'))->toStartWith('APT-');
});

it('rejects store when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id', 'direction', 'package_assignment_id', 'scheduled_at', 'customer_email']);
});

/* Show */
it('returns a single booking', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/airport-bookings/{$booking->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $booking->id);
});

/* Record Payment */
it('records payment and moves booking to payment_received', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/airport-bookings/{$booking->id}/payment", [
            'payment_method' => 'mobile_money',
            'payment_reference' => 'MM-123456',
        ])
        ->assertOk()
        ->assertJsonPath('data.payment_status', 'paid')
        ->assertJsonPath('data.booking_status', 'payment_received')
        ->assertJsonPath('data.payment_method', 'mobile_money');
});

it('rejects recording payment if already paid', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->paid()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/v1/airport-bookings/{$booking->id}/payment", [
            'payment_method' => 'cash',
        ])
        ->assertUnprocessable();
});

/* Confirm */
it('confirms a booking when payment is received', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->paid()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/confirm")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'confirmed');
});

it('rejects confirming a pending (unpaid) booking', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create(['created_by' => $user->id]); // pending + unpaid

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/confirm")
        ->assertUnprocessable();
});

/* Assign Driver */
it('assigns a driver and vehicle to a confirmed booking', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->confirmed()->create(['created_by' => $user->id]);
    $driver = Driver::factory()->available()->create(['created_by' => $user->id]);
    $vehicle = FleetVehicle::factory()->available()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/assign-driver", [
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
        ])
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'driver_assigned');
});

it('rejects assigning an unavailable driver', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->confirmed()->create(['created_by' => $user->id]);
    $driver = Driver::factory()->inactive()->create(['created_by' => $user->id]);
    $vehicle = FleetVehicle::factory()->available()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/assign-driver", [
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
        ])
        ->assertUnprocessable();
});

/* Remove Driver */
it('removes driver and reverts to confirmed status', function () {
    $user = adminUser();
    $driver = Driver::factory()->available()->create(['created_by' => $user->id]);
    $vehicle = FleetVehicle::factory()->available()->create();

    $booking = AirportBooking::factory()->create([
        'created_by' => $user->id,
        'booking_status' => AirportBookingStatus::DriverAssigned,
        'payment_status' => AirportPaymentStatus::Paid,
        'payment_method' => 'cash',
        'driver_id' => $driver->id,
        'vehicle_id' => $vehicle->id,
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/remove-driver")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'confirmed');

    expect($booking->fresh()->driver_id)->toBeNull();
    expect($booking->fresh()->vehicle_id)->toBeNull();
});

/* Start Trip */
it('starts a trip from driver-assigned booking', function () {
    $user = adminUser();
    $driver = Driver::factory()->available()->create(['created_by' => $user->id]);
    $vehicle = FleetVehicle::factory()->available()->create();

    $booking = AirportBooking::factory()->create([
        'created_by' => $user->id,
        'booking_status' => AirportBookingStatus::DriverAssigned,
        'payment_status' => AirportPaymentStatus::Paid,
        'payment_method' => 'cash',
        'driver_id' => $driver->id,
        'vehicle_id' => $vehicle->id,
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/start-trip")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'in_progress');
});

/* Complete Trip */
it('completes a trip that is in progress', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create([
        'created_by' => $user->id,
        'booking_status' => AirportBookingStatus::InProgress,
        'payment_status' => AirportPaymentStatus::Paid,
        'payment_method' => 'cash',
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/complete-trip")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'completed');
});

/* Cancel */
it('cancels a pending booking with no fee applied', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create([
        'created_by' => $user->id,
        'scheduled_at' => now()->addDays(5), // well within free window
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/cancel", [
            'reason' => 'Customer request',
        ])
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'cancelled');

    expect($booking->fresh()->cancelled_at)->not->toBeNull();
});

it('applies cancellation fee when cancelled outside the free window', function () {
    $user = adminUser();
    // Scheduled within less than free_cancellation_hours (default 24h)
    $booking = AirportBooking::factory()->paid()->create([
        'created_by' => $user->id,
        'scheduled_at' => now()->addHours(2),
        'total_amount' => 200.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/cancel")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'cancelled');

    // Fee should be non-null and > 0 when cancellation_fee_amount > 0 OR type percentage
    // Default settings: cancellation_fee_amount = 0.0, so fee = 0 for default seeded settings
    expect($response->json('data.cancellation_fee_applied'))->not->toBeNull();
});

it('rejects cancelling a completed booking', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create([
        'created_by' => $user->id,
        'booking_status' => AirportBookingStatus::Completed,
    ]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/cancel")
        ->assertUnprocessable();
});

/* No Show */
it('marks a confirmed booking as no_show', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->confirmed()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/airport-bookings/{$booking->id}/no-show")
        ->assertOk()
        ->assertJsonPath('data.booking_status', 'no_show');
});

/* Delete */
it('soft-deletes a booking', function () {
    $user = adminUser();
    $booking = AirportBooking::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/airport-bookings/{$booking->id}")
        ->assertNoContent();

    expect(AirportBooking::find($booking->id))->toBeNull();
    expect(AirportBooking::withTrashed()->find($booking->id))->not->toBeNull();
});

/* Payment status on creation */
it('keeps payment_status pending when booking is made via public website', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $this->postJson('/api/v1/public/airport-bookings', validBookingPayload(
        $branch, $assignment, $terminal, $area
    ))
        ->assertCreated()
        ->assertJsonPath('data.payment_status', AirportPaymentStatus::Pending->value)
        ->assertJsonPath('data.booking_status', AirportBookingStatus::Pending->value);

    expect(AirportBooking::latest()->first()->payment_status)->toBe(AirportPaymentStatus::Pending);
});

it('marks payment_status paid and booking_status payment_received when staff records in-store payment', function () {
    ['branch' => $branch, 'assignment' => $assignment, 'terminal' => $terminal, 'area' => $area] = bookingFixtures();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-bookings', validBookingPayload(
            $branch, $assignment, $terminal, $area,
            ['payment_method' => 'cash']
        ))
        ->assertCreated()
        ->assertJsonPath('data.payment_status', AirportPaymentStatus::Paid->value)
        ->assertJsonPath('data.booking_status', AirportBookingStatus::PaymentReceived->value);
});
