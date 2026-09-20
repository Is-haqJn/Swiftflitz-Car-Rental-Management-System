<?php

use App\Enums\CustomerProfileStatus;
use App\Enums\RentalStatus;
use App\Events\PaymentStatusUpdated;
use App\Events\RentalStatusChanged;
use App\Listeners\MarkTransactableAsPaid;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('auto-confirms verified customer rental on payment', function () {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Verified->value]);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
        'total_cost' => 1000,
        'amount_paid' => 0,
    ]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 1000,
        'metadata' => ['purpose' => 'rental'],
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Confirmed);

    Event::assertDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->oldStatus === 'pending' && $e->newStatus === 'confirmed';
    });
});

it('keeps pending for unverified customer rental on payment', function (string $profileStatus) {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => $profileStatus]);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
        'total_cost' => 1000,
        'amount_paid' => 0,
    ]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 1000,
        'metadata' => ['purpose' => 'rental'],
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Pending);

    Event::assertNotDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->newStatus === 'confirmed';
    });
})->with([
    CustomerProfileStatus::Incomplete->value,
    CustomerProfileStatus::PendingReview->value,
    CustomerProfileStatus::Rejected->value,
]);

it('does not auto-confirm non-pending rental on payment', function () {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Verified->value]);
    $rental = Rental::factory()->active()->create(['customer_id' => $customer->id]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 500,
        'metadata' => null,
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Active);

    Event::assertNotDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->newStatus === 'confirmed';
    });
});

it('cascades confirm on all pending paid rentals when customer is verified', function () {
    Event::fake([RentalStatusChanged::class]);

    $admin = adminUser();
    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::PendingReview->value]);

    /* Two paid+pending rentals - should be confirmed after verification */
    $paidRental1 = Rental::factory()->paid()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
    ]);
    $paidRental2 = Rental::factory()->paid()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
    ]);

    /* One unpaid pending rental - should stay pending */
    $unpaidRental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
    ]);

    /* One active rental - should stay active */
    $activeRental = Rental::factory()->active()->create(['customer_id' => $customer->id]);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/customers/{$customer->id}/verify")
        ->assertSuccessful();

    expect($paidRental1->fresh()->status)->toBe(RentalStatus::Confirmed);
    expect($paidRental2->fresh()->status)->toBe(RentalStatus::Confirmed);
    expect($unpaidRental->fresh()->status)->toBe(RentalStatus::Pending);
    expect($activeRental->fresh()->status)->toBe(RentalStatus::Active);

    Event::assertDispatchedTimes(RentalStatusChanged::class, 2);
});

it('auto-confirms verified customer rental on partial payment', function () {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Verified->value]);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
        'total_cost' => 1000,
        'amount_paid' => 0,
    ]);

    /* Partial payment - amount less than total cost */
    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 500,
        'metadata' => ['purpose' => 'rental'],
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Confirmed);

    Event::assertDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->oldStatus === 'pending' && $e->newStatus === 'confirmed';
    });
});

it('does not auto-confirm on deposit-purpose payment', function () {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Verified->value]);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
    ]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 500,
        'metadata' => ['purpose' => 'deposit'],
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Pending);

    Event::assertNotDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->newStatus === 'confirmed';
    });
});

it('does not auto-confirm on damage-purpose payment', function () {
    Event::fake([RentalStatusChanged::class]);

    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Verified->value]);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'status' => RentalStatus::Pending->value,
    ]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'amount' => 300,
        'metadata' => ['purpose' => 'damage'],
    ]);

    $event = new PaymentStatusUpdated($transaction);
    app(MarkTransactableAsPaid::class)->handle($event);

    $rental->refresh();

    expect($rental->status)->toBe(RentalStatus::Pending);

    Event::assertNotDispatched(RentalStatusChanged::class, function (RentalStatusChanged $e) {
        return $e->newStatus === 'confirmed';
    });
});

it('cascade confirm only affects the verified customers own rentals', function () {
    Event::fake([RentalStatusChanged::class]);

    $admin = adminUser();

    $customerA = Customer::factory()->create(['profile_status' => CustomerProfileStatus::PendingReview->value]);
    $customerB = Customer::factory()->create(['profile_status' => CustomerProfileStatus::PendingReview->value]);

    $rentalA = Rental::factory()->paid()->create([
        'customer_id' => $customerA->id,
        'status' => RentalStatus::Pending->value,
    ]);

    $rentalB = Rental::factory()->paid()->create([
        'customer_id' => $customerB->id,
        'status' => RentalStatus::Pending->value,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/customers/{$customerA->id}/verify")
        ->assertSuccessful();

    expect($rentalA->fresh()->status)->toBe(RentalStatus::Confirmed);
    expect($rentalB->fresh()->status)->toBe(RentalStatus::Pending);
});

it('always confirms in-store rental regardless of customer profile status', function () {
    $admin = adminUser();
    $customer = Customer::factory()->create(['profile_status' => CustomerProfileStatus::Incomplete->value]);
    $vehicle = Vehicle::factory()->create();

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/rentals', [
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'payment_method' => 'in_store',
            'pickup_date' => now()->addDays(2)->toDateString(),
            'return_date' => now()->addDays(5)->toDateString(),
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'source' => 'walk_in',
        ]);

    $response->assertSuccessful();

    $rental = Rental::where('customer_id', $customer->id)->first();

    expect($rental)->not->toBeNull();
    expect($rental->status)->toBe(RentalStatus::Confirmed);
});
