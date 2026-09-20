<?php

use App\Enums\QuoteRequestStatus;
use App\Models\Customer;
use App\Models\QuoteRequest;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/* Helper */
function validQuotePayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '+233201234567',
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(7)->format('Y-m-d'),
        'message' => 'I need a comfortable SUV.',
    ], $overrides);
}

// ═══════════════════════════════════════════════════════════════
// ADMIN: Index
// ═══════════════════════════════════════════════════════════════

it('lists quote requests for admin', function () {
    QuoteRequest::factory()->count(3)->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/quote-requests')
        ->assertOk()
        ->assertJsonPath('data.0.reference', fn ($v) => str_starts_with($v, 'QR-'));
});

it('returns 401 for unauthenticated list request', function () {
    $this->getJson('/api/v1/quote-requests')->assertUnauthorized();
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Show
// ═══════════════════════════════════════════════════════════════

it('shows a single quote request', function () {
    $quote = QuoteRequest::factory()->create(['name' => 'John Tester']);

    $this->actingAs(adminUser(), 'sanctum')
        ->getJson("/api/v1/quote-requests/{$quote->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'John Tester')
        ->assertJsonPath('data.status', QuoteRequestStatus::Pending->value);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Store
// ═══════════════════════════════════════════════════════════════

it('admin can create a quote request', function () {
    Queue::fake();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/quote-requests', validQuotePayload())
        ->assertCreated();

    expect($response->json('data.reference'))->toStartWith('QR-');
    expect($response->json('data.status'))->toBe(QuoteRequestStatus::Pending->value);
    $this->assertDatabaseHas('quote_requests', ['email' => 'jane@example.com']);
});

it('validates required fields on store', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/quote-requests', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email']);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Mark Contacted
// ═══════════════════════════════════════════════════════════════

it('marks a quote request as contacted', function () {
    $quote = QuoteRequest::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/quote-requests/{$quote->id}/contact")
        ->assertOk()
        ->assertJsonPath('data.status', QuoteRequestStatus::Contacted->value);

    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'status' => QuoteRequestStatus::Contacted->value,
    ]);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Generate Quote
// ═══════════════════════════════════════════════════════════════

it('generates a quote and assigns a vehicle', function () {
    $quote = QuoteRequest::factory()->create(['status' => QuoteRequestStatus::Contacted->value]);
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/quote-requests/{$quote->id}/generate", [
            'vehicle_id' => $vehicle->id,
            'admin_notes' => 'Good to go.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', QuoteRequestStatus::Quoted->value);

    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'vehicle_id' => $vehicle->id,
        'admin_notes' => 'Good to go.',
        'status' => QuoteRequestStatus::Quoted->value,
    ]);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Send Quote
// ═══════════════════════════════════════════════════════════════

it('sends the quote and sets a token', function () {
    Mail::fake();

    $vehicle = Vehicle::factory()->create();
    $quote = QuoteRequest::factory()->quoted()->create([
        'vehicle_id' => $vehicle->id,
        'email' => 'customer@example.com',
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/quote-requests/{$quote->id}/send")
        ->assertOk()
        ->assertJsonPath('data.status', QuoteRequestStatus::Sent->value);

    expect($response->json('data.quote_token'))->not->toBeNull();

    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'status' => QuoteRequestStatus::Sent->value,
    ]);

    Mail::assertQueued(\App\Mail\QuoteReadyMail::class, fn ($m) => $m->quoteRequest->id === $quote->id);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Convert Quote
// ═══════════════════════════════════════════════════════════════

it('converts a quote to a rental', function () {
    Queue::fake();

    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();
    $quote = QuoteRequest::factory()->quoted()->create([
        'vehicle_id' => $vehicle->id,
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(7)->format('Y-m-d'),
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->patchJson("/api/v1/quote-requests/{$quote->id}/convert", [
            'customer_id' => $customer->id,
            'pickup_time' => '10:00',
            'return_time' => '10:00',
        ])
        ->assertOk();

    expect($response->json('data.reference'))->not->toBeNull();

    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'status' => QuoteRequestStatus::Converted->value,
    ]);

    $this->assertDatabaseHas('rentals', [
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'source' => 'quote_request',
    ]);
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: Delete
// ═══════════════════════════════════════════════════════════════

it('deletes a quote request (soft delete)', function () {
    $quote = QuoteRequest::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->deleteJson("/api/v1/quote-requests/{$quote->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('quote_requests', ['id' => $quote->id]);
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC: Submit
// ═══════════════════════════════════════════════════════════════

it('allows public submission of a quote request', function () {
    Queue::fake();

    $this->postJson('/api/v1/public/bookings', [
        'name' => 'Public User',
        'email' => 'public@example.com',
        'pickup_date' => now()->addDays(2)->format('Y-m-d'),
        'return_date' => now()->addDays(5)->format('Y-m-d'),
    ])
        ->assertCreated()
        ->assertJsonPath('data.status', QuoteRequestStatus::Pending->value);

    $this->assertDatabaseHas('quote_requests', ['email' => 'public@example.com']);
});

it('validates required fields on public submission', function () {
    $this->postJson('/api/v1/public/bookings', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email']);
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC: Get by Token
// ═══════════════════════════════════════════════════════════════

it('returns a quote by valid token', function () {
    $vehicle = Vehicle::factory()->create();
    $quote = QuoteRequest::factory()->sent()->create([
        'vehicle_id' => $vehicle->id,
        'name' => 'Token User',
    ]);

    $this->getJson("/api/v1/public/quotes/{$quote->quote_token}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Token User');
});

it('returns 410 for an expired token', function () {
    $quote = QuoteRequest::factory()->expired()->create();

    $this->getJson("/api/v1/public/quotes/{$quote->quote_token}")
        ->assertStatus(410);
});

it('returns 409 for a converted quote token', function () {
    $quote = QuoteRequest::factory()->converted()->create([
        'quote_token' => bin2hex(random_bytes(32)),
        'token_expires_at' => now()->addHours(24),
    ]);

    $this->getJson("/api/v1/public/quotes/{$quote->quote_token}")
        ->assertStatus(409);
});

it('returns 404 for an unknown token', function () {
    $this->getJson('/api/v1/public/quotes/nonexistent-token-xyz')
        ->assertNotFound();
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC: Confirm
// ═══════════════════════════════════════════════════════════════

it('customer can confirm a quote and a rental is created', function () {
    Queue::fake();

    $vehicle = Vehicle::factory()->create();
    $quote = QuoteRequest::factory()->sent()->create([
        'vehicle_id' => $vehicle->id,
        'name' => 'Confirm User',
        'email' => 'confirm@example.com',
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(7)->format('Y-m-d'),
    ]);

    $response = $this->postJson("/api/v1/public/quotes/{$quote->quote_token}/confirm", [
        'customer_name' => 'Confirm User',
        'customer_email' => 'confirm@example.com',
        'customer_phone' => '+233201234567',
        'license_number' => 'LIC-001',
        'license_expiry_date' => now()->addYears(2)->format('Y-m-d'),
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-12345678-9',
        'pickup_time' => '09:00',
        'return_time' => '09:00',
    ])->assertCreated();

    expect($response->json('data.rental_reference'))->not->toBeNull();

    $this->assertDatabaseHas('customers', ['email' => 'confirm@example.com', 'name' => 'Confirm User']);
    $this->assertDatabaseHas('rentals', ['vehicle_id' => $vehicle->id, 'source' => 'quote_request']);
    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'status' => QuoteRequestStatus::Converted->value,
    ]);
});

it('does not create a duplicate customer if one already exists', function () {
    Queue::fake();

    $vehicle = Vehicle::factory()->create();
    Customer::factory()->create(['email' => 'existing@example.com', 'name' => 'Existing Customer', 'license_number' => null]);

    $quote = QuoteRequest::factory()->sent()->create([
        'vehicle_id' => $vehicle->id,
        'name' => 'Existing Customer',
        'email' => 'existing@example.com',
        'pickup_date' => now()->addDays(3)->format('Y-m-d'),
        'return_date' => now()->addDays(7)->format('Y-m-d'),
    ]);

    $this->postJson("/api/v1/public/quotes/{$quote->quote_token}/confirm", [
        'customer_name' => 'Existing Customer',
        'customer_email' => 'existing@example.com',
        'customer_phone' => '+233201234567',
        'license_number' => 'LIC-002',
        'license_expiry_date' => now()->addYears(2)->format('Y-m-d'),
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-99999999-9',
        'pickup_time' => '09:00',
        'return_time' => '09:00',
    ])->assertCreated();

    expect(Customer::where('email', 'existing@example.com')->count())->toBe(1);
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC: Cancel
// ═══════════════════════════════════════════════════════════════

it('customer can cancel a quote', function () {
    $quote = QuoteRequest::factory()->sent()->create();

    $this->postJson("/api/v1/public/quotes/{$quote->quote_token}/cancel")
        ->assertOk();

    $this->assertDatabaseHas('quote_requests', [
        'id' => $quote->id,
        'status' => QuoteRequestStatus::Cancelled->value,
    ]);
});

// ═══════════════════════════════════════════════════════════════
// Filters
// ═══════════════════════════════════════════════════════════════

it('filters quote requests by status', function () {
    QuoteRequest::factory()->count(2)->create(['status' => QuoteRequestStatus::Pending->value]);
    QuoteRequest::factory()->count(3)->contacted()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/quote-requests?filter[status]=contacted')
        ->assertOk();

    expect($response->json('data'))->toHaveCount(3);
    collect($response->json('data'))->each(fn ($q) => expect($q['status'])->toBe('contacted'));
});

it('searches quote requests by name', function () {
    QuoteRequest::factory()->create(['name' => 'Alice Wonderland']);
    QuoteRequest::factory()->create(['name' => 'Bob Builder']);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/quote-requests?filter[search]=Alice')
        ->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Alice Wonderland');
});
