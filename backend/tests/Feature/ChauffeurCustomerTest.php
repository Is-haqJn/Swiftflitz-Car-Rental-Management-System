<?php

use App\Models\ChauffeurCustomer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Index */
it('returns a paginated list of chauffeur customers', function () {
    ChauffeurCustomer::factory(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('requires authentication to list chauffeur customers', function () {
    $this->getJson('/api/v1/chauffeur-customers')->assertUnauthorized();
});

it('filters chauffeur customers by full_name', function () {
    ChauffeurCustomer::factory()->create(['full_name' => 'Orlando Smith']);
    ChauffeurCustomer::factory(2)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers?filter[full_name]=Orlando')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.full_name', 'Orlando Smith');
});

/* Lookup */
it('lookup returns a chauffeur customer by exact email', function () {
    $customer = ChauffeurCustomer::factory()->create(['email' => 'lookup@example.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers/lookup?email=lookup@example.com')
        ->assertOk()
        ->assertJsonPath('data.id', $customer->id)
        ->assertJsonPath('data.email', 'lookup@example.com');
});

it('lookup returns 404 for an unknown email', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers/lookup?email=nobody@example.com')
        ->assertNotFound();
});

it('lookup requires an email query parameter', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers/lookup')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

/* Store */
it('creates a chauffeur customer with all fields', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-customers', [
            'full_name' => 'Alice Smith',
            'email' => 'alice@example.com',
            'phone' => '+233201234567',
            'expected_destination' => '123 Airport Road, Accra',
        ])
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Alice Smith')
        ->assertJsonPath('data.email', 'alice@example.com')
        ->assertJsonPath('data.phone', '+233201234567');

    expect(ChauffeurCustomer::where('email', 'alice@example.com')->exists())->toBeTrue();
});

it('creates a chauffeur customer without email', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-customers', [
            'full_name' => 'Bob Jones',
            'phone' => '+233200000001',
        ])
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Bob Jones');

    expect(ChauffeurCustomer::where('phone', '+233200000001')->exists())->toBeTrue();
});

it('rejects creation when required fields are missing', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-customers', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['full_name', 'phone']);
});

it('rejects invalid email on store', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/chauffeur-customers', [
            'full_name' => 'Test User',
            'email' => 'not-an-email',
            'phone' => '+233200000002',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

/* Show */
it('returns a single chauffeur customer', function () {
    $customer = ChauffeurCustomer::factory()->create(['full_name' => 'Carol White']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/chauffeur-customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Carol White');
});

it('returns 404 for a non-existent chauffeur customer', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/chauffeur-customers/00000000-0000-0000-0000-000000000000')
        ->assertNotFound();
});

/* Update */
it('updates a chauffeur customer phone number', function () {
    $customer = ChauffeurCustomer::factory()->create(['phone' => '+233200000000']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/chauffeur-customers/{$customer->id}", [
            'phone' => '+233209999999',
        ])
        ->assertOk()
        ->assertJsonPath('data.phone', '+233209999999');

    expect($customer->fresh()->phone)->toBe('+233209999999');
});

it('updates expected_destination on a chauffeur customer', function () {
    $customer = ChauffeurCustomer::factory()->create(['expected_destination' => null]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/chauffeur-customers/{$customer->id}", [
            'expected_destination' => 'Kotoka International Airport',
        ])
        ->assertOk()
        ->assertJsonPath('data.expected_destination', 'Kotoka International Airport');
});

/* Delete */
it('deletes a chauffeur customer', function () {
    $customer = ChauffeurCustomer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/chauffeur-customers/{$customer->id}")
        ->assertNoContent();

    expect(ChauffeurCustomer::find($customer->id))->toBeNull();
});

it('requires authentication to delete a chauffeur customer', function () {
    $customer = ChauffeurCustomer::factory()->create();

    $this->deleteJson("/api/v1/chauffeur-customers/{$customer->id}")
        ->assertUnauthorized();

    expect(ChauffeurCustomer::find($customer->id))->not->toBeNull();
});
