<?php

use App\Models\AirportCustomer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Index */
it('returns a paginated list of airport customers', function () {
    AirportCustomer::factory(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-customers')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('requires authentication to list customers', function () {
    $this->getJson('/api/v1/airport-customers')->assertUnauthorized();
});

it('filters customers by email', function () {
    AirportCustomer::factory()->create(['email' => 'john@example.com', 'full_name' => 'John Doe']);
    AirportCustomer::factory(2)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-customers?filter[email]=john')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'john@example.com');
});

/* Lookup */
it('lookup returns a customer by exact email', function () {
    $customer = AirportCustomer::factory()->create(['email' => 'lookup@example.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-customers/lookup?email=lookup@example.com')
        ->assertOk()
        ->assertJsonPath('data.id', $customer->id)
        ->assertJsonPath('data.email', 'lookup@example.com');
});

it('lookup returns 404 for an unknown email', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-customers/lookup?email=nobody@example.com')
        ->assertNotFound();
});

it('lookup requires an email query parameter', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/airport-customers/lookup')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

/* Store */
it('creates an airport customer with valid data', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-customers', [
            'full_name' => 'Alice Smith',
            'email' => 'alice@example.com',
            'phone' => '+233201234567',
        ])
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Alice Smith')
        ->assertJsonPath('data.email', 'alice@example.com');

    expect(AirportCustomer::where('email', 'alice@example.com')->exists())->toBeTrue();
});

it('rejects duplicate email on store', function () {
    AirportCustomer::factory()->create(['email' => 'dup@example.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-customers', [
            'full_name' => 'Dup User',
            'email' => 'dup@example.com',
            'phone' => '+233200000000',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('rejects creation when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/airport-customers', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['full_name', 'email', 'phone']);
});

/* Show */
it('returns a single airport customer', function () {
    $customer = AirportCustomer::factory()->create(['full_name' => 'Bob Jones']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/airport-customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Bob Jones');
});

/* Update */
it('updates an airport customer', function () {
    $customer = AirportCustomer::factory()->create(['phone' => '+233200000000']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airport-customers/{$customer->id}", [
            'phone' => '+233209999999',
        ])
        ->assertOk()
        ->assertJsonPath('data.phone', '+233209999999');

    expect($customer->fresh()->phone)->toBe('+233209999999');
});

it('allows updating email to own email without duplicate error', function () {
    $customer = AirportCustomer::factory()->create(['email' => 'own@example.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/airport-customers/{$customer->id}", [
            'email' => 'own@example.com',
        ])
        ->assertOk()
        ->assertJsonPath('data.email', 'own@example.com');
});

/* Delete */
it('deletes an airport customer', function () {
    $customer = AirportCustomer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/airport-customers/{$customer->id}")
        ->assertNoContent();

    expect(AirportCustomer::find($customer->id))->toBeNull();
});
