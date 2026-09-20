<?php

use App\Enums\AirportBookingStatus;
use App\Enums\ChauffeurBookingStatus;
use App\Enums\RentalStatus;
use App\Models\AirportBooking;
use App\Models\Branch;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* GET /api/v1/dashboard */
it('requires authentication to view dashboard stats', function () {
    $this->getJson('/api/v1/dashboard')
        ->assertUnauthorized();
});

it('returns dashboard stats with expected keys', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('vehicles')
        ->and($data)->toHaveKey('customers')
        ->and($data)->toHaveKey('rentals')
        ->and($data)->toHaveKey('revenue')
        ->and($data)->toHaveKey('airport_bookings')
        ->and($data)->toHaveKey('chauffeur_bookings');
});

it('returns real rental counts in dashboard stats', function () {
    $user = adminUser();
    Rental::factory()->count(2)->create(['status' => RentalStatus::Active->value]);
    Rental::factory()->count(1)->create(['status' => RentalStatus::Overdue->value]);
    Rental::factory()->count(3)->create(['status' => RentalStatus::Pending->value]);

    $data = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    expect($data['rentals']['active'])->toBe(2)
        ->and($data['rentals']['overdue'])->toBe(1)
        ->and($data['rentals']['pending'])->toBe(3);
});

it('returns real airport booking counts in dashboard stats', function () {
    $user = adminUser();
    AirportBooking::factory()->count(2)->create(['booking_status' => AirportBookingStatus::Pending->value]);
    AirportBooking::factory()->count(1)->create(['booking_status' => AirportBookingStatus::Confirmed->value]);

    $data = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    expect($data['airport_bookings']['pending'])->toBe(2);
});

it('returns real chauffeur booking counts in dashboard stats', function () {
    $user = adminUser();
    ChauffeurBooking::factory()->count(3)->create(['booking_status' => ChauffeurBookingStatus::Pending->value]);

    $data = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    expect($data['chauffeur_bookings']['pending'])->toBe(3);
});

/* GET /api/v1/dashboard/revenue-trend */
it('requires authentication to view revenue trend', function () {
    $this->getJson('/api/v1/dashboard/revenue-trend')
        ->assertUnauthorized();
});

it('returns revenue trend data with monthly period by default', function () {
    $user = adminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('returns revenue trend data with daily period', function () {
    $user = adminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=daily')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('returns revenue trend data with monthly period', function () {
    $user = adminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=monthly')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('returns empty array for revenue trend when no paid transactions exist', function () {
    $user = adminUser();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=monthly')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray()->toBeEmpty();
});

it('starts monthly revenue trend from first transaction month not 12 months ago', function () {
    $user = adminUser();

    PaymentTransaction::factory()->paid()->create([
        'amount' => 200.00,
        'paid_at' => now()->subMonths(2)->startOfMonth(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=monthly')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toBeArray()
        ->and(count($data))->toBeLessThan(12)
        ->and(count($data))->toBeGreaterThanOrEqual(2);
});

it('starts weekly revenue trend from first transaction week not 12 weeks ago', function () {
    $user = adminUser();

    PaymentTransaction::factory()->paid()->create([
        'amount' => 100.00,
        'paid_at' => now()->subWeeks(3)->startOfWeek(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=weekly')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toBeArray()
        ->and(count($data))->toBeLessThan(12)
        ->and(count($data))->toBeGreaterThanOrEqual(2);
});

it('aggregates weekly revenue correctly across multiple transactions in the same week', function () {
    $user = adminUser();
    Cache::flush();
    $weekStart = now()->subWeeks(1)->startOfWeek();

    PaymentTransaction::factory()->paid()->create([
        'amount' => 100.00,
        'paid_at' => $weekStart->copy(),
    ]);
    PaymentTransaction::factory()->paid()->create([
        'amount' => 50.00,
        'paid_at' => $weekStart->copy()->addDays(2),
    ]);

    $data = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend?period=weekly')
        ->assertSuccessful()
        ->json('data');

    $weekEntry = collect($data)->firstWhere('period', $weekStart->format('M d'));

    expect($weekEntry)->not->toBeNull()
        ->and((float) $weekEntry['revenue'])->toBe(150.0)
        ->and($weekEntry['count'])->toBe(2);
});

/* GET /api/v1/dashboard/vehicle-utilization */
it('requires authentication to view vehicle utilization', function () {
    $this->getJson('/api/v1/dashboard/vehicle-utilization')
        ->assertUnauthorized();
});

it('returns vehicle utilization data', function () {
    $user = adminUser();
    Vehicle::factory()->count(3)->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/vehicle-utilization')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* GET /api/v1/dashboard/recent-activity */
it('requires authentication to view recent activity', function () {
    $this->getJson('/api/v1/dashboard/recent-activity')
        ->assertUnauthorized();
});

it('returns recent activity with recent_rentals and recent_quotes keys', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/recent-activity')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('recent_rentals')
        ->and($data)->toHaveKey('recent_quotes');
});

it('respects the limit parameter for recent activity', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/recent-activity?limit=5')
        ->assertSuccessful();
});

/* GET /api/v1/dashboard/upcoming-returns */
it('requires authentication to view upcoming returns', function () {
    $this->getJson('/api/v1/dashboard/upcoming-returns')
        ->assertUnauthorized();
});

it('returns upcoming returns with due_today and overdue keys', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/upcoming-returns')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('due_today')
        ->and($data)->toHaveKey('overdue');
});

it('respects the limit parameter for upcoming returns', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/upcoming-returns?limit=5')
        ->assertSuccessful();
});

/* Analytics permission gate */
it('returns 403 for revenue-trend without analytics permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend')
        ->assertForbidden();
});

it('returns 403 for vehicle-utilization without analytics permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/vehicle-utilization')
        ->assertForbidden();
});

it('allows revenue-trend for user with dashboard.view_analytics permission', function () {
    $user = adminUser();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue-trend')
        ->assertSuccessful();
});

it('allows vehicle-utilization for user with dashboard.view_analytics permission', function () {
    $user = adminUser();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/dashboard/vehicle-utilization')
        ->assertSuccessful();
});

/* Dashboard branch scoping */
it('scopes dashboard stats to branch for a branch-assigned user', function () {
    // ? Create two branches with vehicles
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    Vehicle::factory()->create(['branch_id' => $branch->id, 'status' => 'rented']);
    Vehicle::factory()->create(['branch_id' => $otherBranch->id, 'status' => 'rented']);

    // ? Create a manager assigned only to the first branch
    $manager = User::factory()->create();
    $manager->branches()->attach($branch->id);

    $response = $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful();

    $data = $response->json('data');

    // ? Branch manager should only see vehicles in their branch
    expect($data['vehicles']['in_use'])->toBe(1);
});

it('returns global stats for super admin', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    Vehicle::factory()->create(['branch_id' => $branch->id, 'status' => 'rented']);
    Vehicle::factory()->create(['branch_id' => $otherBranch->id, 'status' => 'rented']);

    $admin = adminUser();

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful();

    $data = $response->json('data');

    // ? Super admin should see all vehicles across both branches
    expect($data['vehicles']['in_use'])->toBe(2);
});
