<?php

use App\Models\Category;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('accepts date_of_birth on quote request and stores it on an existing customer', function () {
    Queue::fake();

    $dob = now()->subYears(25)->format('Y-m-d');

    /* Pre-existing customer matched by email */
    $customer = Customer::factory()->create([
        'email' => 'dob@example.com',
        'date_of_birth' => null,
    ]);

    $this->postJson('/api/v1/public/bookings', [
        'name' => 'DOB User',
        'email' => 'dob@example.com',
        'pickup_date' => now()->addDays(2)->format('Y-m-d'),
        'return_date' => now()->addDays(5)->format('Y-m-d'),
        'date_of_birth' => $dob,
    ])->assertCreated();

    $this->assertDatabaseHas('quote_requests', ['email' => 'dob@example.com']);

    $customer->refresh();
    expect($customer->date_of_birth->format('Y-m-d'))->toBe($dob);
});

it('rejects date_of_birth for customer under 18', function () {
    Queue::fake();

    $dob = now()->subYears(17)->format('Y-m-d');

    $this->postJson('/api/v1/public/bookings', [
        'name' => 'Young User',
        'email' => 'young@example.com',
        'pickup_date' => now()->addDays(2)->format('Y-m-d'),
        'return_date' => now()->addDays(5)->format('Y-m-d'),
        'date_of_birth' => $dob,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['date_of_birth']);
});

it('allows null date_of_birth (optional field)', function () {
    Queue::fake();

    $this->postJson('/api/v1/public/bookings', [
        'name' => 'No DOB User',
        'email' => 'nodob@example.com',
        'pickup_date' => now()->addDays(2)->format('Y-m-d'),
        'return_date' => now()->addDays(5)->format('Y-m-d'),
    ])->assertCreated();

    $this->assertDatabaseHas('quote_requests', ['email' => 'nodob@example.com']);
});

it('does not overwrite existing customer dob on re-submission', function () {
    Queue::fake();

    $originalDob = now()->subYears(30)->format('Y-m-d');
    $newDob = now()->subYears(25)->format('Y-m-d');

    $customer = Customer::factory()->create([
        'email' => 'returning@example.com',
        'date_of_birth' => $originalDob,
    ]);

    $this->postJson('/api/v1/public/bookings', [
        'name' => 'Returning User',
        'email' => 'returning@example.com',
        'pickup_date' => now()->addDays(2)->format('Y-m-d'),
        'return_date' => now()->addDays(5)->format('Y-m-d'),
        'date_of_birth' => $newDob,
    ])->assertCreated();

    /* Original DOB must be preserved */
    $customer->refresh();
    expect($customer->date_of_birth->format('Y-m-d'))->toBe($originalDob);
});

it('book-new stores date_of_birth on new customer', function () {
    Mail::fake();

    $settings = app(RentalSettings::class);
    $settings->allow_online_booking = true;
    $settings->save();

    $category = Category::factory()->create();
    $vehicle = Vehicle::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
    ]);

    $dob = now()->subYears(25)->format('Y-m-d');

    $this->postJson('/api/v1/public/booking/book-new', [
        'name' => 'New Customer',
        'email' => 'new-dob@example.com',
        'phone' => '+233200000001',
        'vehicle_id' => $vehicle->id,
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(6)->format('Y-m-d'),
        'date_of_birth' => $dob,
    ])->assertOk();

    $customer = Customer::where('email', 'new-dob@example.com')->first();
    expect($customer)->not->toBeNull();
    expect($customer->date_of_birth->format('Y-m-d'))->toBe($dob);
});

it('book-new works without date_of_birth', function () {
    Mail::fake();

    $settings = app(RentalSettings::class);
    $settings->allow_online_booking = true;
    $settings->save();

    $category = Category::factory()->create();
    $vehicle = Vehicle::factory()->create([
        'category_id' => $category->id,
        'status' => 'available',
    ]);

    $this->postJson('/api/v1/public/booking/book-new', [
        'name' => 'New Customer',
        'email' => 'no-dob-new@example.com',
        'phone' => '+233200000002',
        'vehicle_id' => $vehicle->id,
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(6)->format('Y-m-d'),
    ])->assertOk();

    $customer = Customer::where('email', 'no-dob-new@example.com')->first();
    expect($customer)->not->toBeNull();
    expect($customer->date_of_birth)->toBeNull();
});
