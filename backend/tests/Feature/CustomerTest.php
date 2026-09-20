<?php

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Helpers */
function customerPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '+233241234567',
        'address' => '12 Accra Road, East Legon',
        'license_number' => 'DL-1234567',
        'license_expiry_date' => now()->addYear()->toDateString(),
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-000000000-0',
    ], $overrides);
}

/* Authentication */
it('requires authentication to access customers', function () {
    $this->getJson('/api/v1/customers')->assertUnauthorized();
});

/* Index */
it('can list customers', function () {
    Customer::factory()->count(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/customers')
        ->assertSuccessful()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

/* Store */
it('can create a customer', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/customers', customerPayload())
        ->assertCreated()
        ->assertJsonPath('data.email', 'john@example.com')
        ->assertJsonPath('data.name', 'John Doe');
});

it('validates required fields when creating a customer', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/customers', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'phone']);
});

it('rejects duplicate email when creating a customer', function () {
    $user = User::factory()->create();
    $existing = Customer::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/customers', customerPayload(['email' => $existing->email]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

/* Show */
it('can show a customer', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/customers/{$customer->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $customer->id);
});

it('returns 404 for a non-existent customer', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/customers/non-existent-id')
        ->assertNotFound();
});

/* Update */
it('can update a customer', function () {
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson("/api/v1/customers/{$customer->id}", customerPayload([
            'name' => 'Jane Updated',
            'email' => $customer->email,
            'license_number' => $customer->license_number,
            'notes' => 'Updated via test.',
        ]))
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Jane Updated')
        ->assertJsonPath('data.notes', 'Updated via test.');
});

/* Delete */
it('can delete a customer', function () {
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/customers/{$customer->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
});

/* Toggle Blacklist */
it('can blacklist a customer', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->create(['is_blacklisted' => false]);

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/customers/{$customer->id}/toggle-blacklist", [
            'blacklist_reason' => 'Damaged vehicle without reporting.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.is_blacklisted', true);
});

it('can remove a customer from the blacklist', function () {
    $user = User::factory()->create();
    $customer = Customer::factory()->blacklisted()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson("/api/v1/customers/{$customer->id}/toggle-blacklist")
        ->assertSuccessful()
        ->assertJsonPath('data.is_blacklisted', false);
});

/* Blacklisted list */
it('can list blacklisted customers', function () {
    $user = User::factory()->create();
    Customer::factory()->blacklisted()->count(2)->create();
    Customer::factory()->count(3)->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/customers/blacklisted')
        ->assertSuccessful();

    foreach ($response->json('data') as $item) {
        expect($item['is_blacklisted'])->toBeTrue();
    }
});
