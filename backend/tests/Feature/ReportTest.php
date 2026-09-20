<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\RentalInspection;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

$reportTypes = [
    'revenue',
    'vehicles',
    'manager-performance',
    'outstanding-payments',
    'maintenance',
    'customer-analysis',
];

/* Authentication guards */
it('requires authentication to access revenue report', function () {
    $this->getJson('/api/v1/reports/revenue')
        ->assertUnauthorized();
});

it('requires authentication to access vehicles report', function () {
    $this->getJson('/api/v1/reports/vehicles')
        ->assertUnauthorized();
});

it('requires authentication to access manager-performance report', function () {
    $this->getJson('/api/v1/reports/manager-performance')
        ->assertUnauthorized();
});

it('requires authentication to access outstanding-payments report', function () {
    $this->getJson('/api/v1/reports/outstanding-payments')
        ->assertUnauthorized();
});

it('requires authentication to access maintenance report', function () {
    $this->getJson('/api/v1/reports/maintenance')
        ->assertUnauthorized();
});

it('requires authentication to access customer-analysis report', function () {
    $this->getJson('/api/v1/reports/customer-analysis')
        ->assertUnauthorized();
});

/* Revenue report */
it('can retrieve revenue report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

it('can filter revenue report by date range', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue?start_date=2026-01-01&end_date=2026-01-31')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* Vehicles report */
it('can retrieve vehicles report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/vehicles')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* Manager performance report */
it('can retrieve manager-performance report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/manager-performance')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* Outstanding payments report */
it('can retrieve outstanding-payments report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/outstanding-payments')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* Maintenance report */
it('can retrieve maintenance report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/maintenance')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* Customer analysis report */
it('can retrieve customer-analysis report', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/customer-analysis')
        ->assertSuccessful();

    expect($response->json('data'))->toBeArray();
});

/* PDF export */
it('requires authentication to export a report as pdf', function () {
    $this->getJson('/api/v1/reports/revenue/export/pdf')
        ->assertUnauthorized();
});

it('returns 404 for invalid report type pdf export', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/invalid-type/export/pdf')
        ->assertNotFound();
});

it('can export revenue report as pdf', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue/export/pdf');

    expect($response->status())->toBeIn([200, 204]);
});

/* Vehicle expense report */
it('requires authentication to access vehicle expense report', function () {
    $this->getJson('/api/v1/reports/vehicle-expenses')
        ->assertUnauthorized();
});

it('can retrieve vehicle expense report', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    VehicleExpense::create([
        'vehicle_id' => $vehicle->id,
        'recorded_by' => $user->id,
        'expense_type' => 'fuel',
        'description' => 'Test fuel expense',
        'amount' => 150.00,
        'expense_date' => now()->toDateString(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/vehicle-expenses')
        ->assertSuccessful()
        ->assertJsonPath('status', 'success');

    expect($response->json('data'))->toBeArray();
});

it('paginates the vehicle expense report detail table', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    for ($i = 1; $i <= 6; $i++) {
        VehicleExpense::create([
            'vehicle_id' => $vehicle->id,
            'recorded_by' => $user->id,
            'expense_type' => 'maintenance',
            'description' => "Expense {$i}",
            'amount' => 100.00 * $i,
            'expense_date' => now()->subDays($i)->toDateString(),
        ]);
    }

    $start = now()->subDays(10)->toDateString();
    $end = now()->toDateString();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/reports/vehicle-expenses?per_page=3&start_date={$start}&end_date={$end}")
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('expenses');
    expect($data)->toHaveKey('expenses_pagination');
    expect($data['expenses_pagination']['per_page'])->toBe(3);
    expect($data['expenses_pagination']['total'])->toBe(6);
    expect($data['expenses_pagination']['last_page'])->toBe(2);
});

it('returns aggregation data on full dataset regardless of page', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    for ($i = 1; $i <= 4; $i++) {
        VehicleExpense::create([
            'vehicle_id' => $vehicle->id,
            'recorded_by' => $user->id,
            'expense_type' => 'fuel',
            'description' => "Expense {$i}",
            'amount' => 100.00,
            'expense_date' => now()->subDays($i)->toDateString(),
        ]);
    }

    $start = now()->subDays(10)->toDateString();
    $end = now()->toDateString();

    // Page 2 with per_page=2 - paginated expenses will have 2, but total should still reflect all 4
    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/reports/vehicle-expenses?per_page=2&page=2&start_date={$start}&end_date={$end}")
        ->assertSuccessful();

    expect($response->json('data.expenses_pagination.total'))->toBe(4);
});

/* Revenue report - data assertions */
it('returns correct revenue totals from paid transaction fixtures', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'payment_status' => 'paid',
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(3)->toDateString(),
        'total_cost' => 500.00,
        'amount_paid' => 500.00,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 500.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rental->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    $data = $response->json('data');
    expect((float) $data['summary']['collected_revenue'])->toBe(500.0);
    expect((float) $data['summary']['net_revenue'])->toBe(500.0);
    expect((float) $data['summary']['gross_revenue'])->toBe(500.0);
    expect((float) $data['summary']['refunded_amount'])->toBe(0.0);
    expect((float) $data['summary']['outstanding_balance'])->toBe(0.0);
    expect($data['summary']['total_rentals'])->toBe(1);
    expect($data['chart'])->not->toBeEmpty();
    expect($data['chart'][0])->toHaveKey('transaction_count');
});

it('excludes cancelled rentals from revenue totals', function () {
    $user = User::factory()->create();

    Rental::factory()->cancelled()->create([
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 300.00,
        'amount_paid' => 0,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    /* No paid transactions = zero collected revenue; no non-cancelled rentals = zero count. */
    expect((float) $response->json('data.summary.collected_revenue'))->toBe(0.0);
    expect((float) $response->json('data.summary.gross_revenue'))->toBe(0.0);
    expect($response->json('data.summary.total_rentals'))->toBe(0);
});

it('filters revenue report by branch_id', function () {
    $user = adminUser();
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $vehicle = Vehicle::factory()->create(['branch_id' => $branch->id]);
    $customer = Customer::factory()->create();

    $rentalInBranch = Rental::factory()->completed()->create([
        'branch_id' => $branch->id,
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'payment_status' => 'paid',
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 300.00,
        'amount_paid' => 300.00,
    ]);

    $rentalOtherBranch = Rental::factory()->completed()->create([
        'branch_id' => $otherBranch->id,
        'payment_status' => 'paid',
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 700.00,
        'amount_paid' => 700.00,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalInBranch->id,
        'transactable_type' => 'rental',
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 700.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalOtherBranch->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/reports/revenue?branch_id={$branch->id}")
        ->assertSuccessful();

    expect((float) $response->json('data.summary.collected_revenue'))->toBe(300.0);
    expect($response->json('data.summary.total_rentals'))->toBe(1);
});

it('auto-scopes revenue report to manager assigned branches', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    $manager = User::factory()->create();
    $role = Role::findOrCreate('manager');
    $manager->assignRole($role);
    $manager->branches()->attach($branch->id);

    $rentalInBranch = Rental::factory()->completed()->create([
        'branch_id' => $branch->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 400.00,
        'amount_paid' => 400.00,
    ]);

    Rental::factory()->completed()->create([
        'branch_id' => $otherBranch->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 600.00,
        'amount_paid' => 600.00,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 400.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalInBranch->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    expect((float) $response->json('data.summary.collected_revenue'))->toBe(400.0);
});

it('allows admin to see all branches without restriction', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    $rentalA = Rental::factory()->completed()->create([
        'branch_id' => $branch->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
    ]);

    $rentalB = Rental::factory()->completed()->create([
        'branch_id' => $otherBranch->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalA->id,
        'transactable_type' => 'rental',
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 500.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalB->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    expect((float) $response->json('data.summary.collected_revenue'))->toBe(800.0);
});

it('manager cannot override branch_id to see other branch data', function () {
    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    $manager = User::factory()->create();
    $role = Role::findOrCreate('manager');
    $manager->assignRole($role);
    $manager->branches()->attach($branch->id);

    $rentalOther = Rental::factory()->completed()->create([
        'branch_id' => $otherBranch->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 999.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rentalOther->id,
        'transactable_type' => 'rental',
    ]);

    /* Manager passes other branch's ID - scopedFilters() should strip it. */
    $response = $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/reports/revenue?branch_id={$otherBranch->id}")
        ->assertSuccessful();

    expect((float) $response->json('data.summary.collected_revenue'))->toBe(0.0);
});

it('separates refunded transactions from collected revenue in revenue report', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'payment_status' => 'paid',
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(3)->toDateString(),
        'total_cost' => 600.00,
        'amount_paid' => 600.00,
    ]);

    /* A regular payment transaction */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 600.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rental->id,
        'transactable_type' => 'rental',
    ]);

    /* A refund transaction */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 100.00,
        'type' => 'refund',
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rental->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertSuccessful();

    $summary = $response->json('data.summary');
    expect((float) $summary['collected_revenue'])->toBe(600.0);
    expect((float) $summary['refunded_amount'])->toBe(100.0);
    expect((float) $summary['net_revenue'])->toBe(500.0);
    expect((float) $summary['gross_revenue'])->toBe(600.0);
    expect((float) $summary['collection_rate'])->toBe(100.0);
});

it('returns collection_rate of zero when there are no rentals', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue?start_date=2020-01-01&end_date=2020-01-31')
        ->assertSuccessful();

    expect((float) $response->json('data.summary.collection_rate'))->toBe(0.0);
    expect((float) $response->json('data.summary.gross_revenue'))->toBe(0.0);
});

/* Vehicle report - data assertions */
it('returns vehicles list with utilization_rate in vehicle report', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(4)->toDateString(),
        'rental_days' => 4,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/vehicles')
        ->assertSuccessful();

    $vehicles = $response->json('data.vehicles');
    expect($vehicles)->not->toBeEmpty();

    $row = collect($vehicles)->firstWhere('id', $vehicle->id);
    expect($row)->not->toBeNull();
    expect($row['total_rentals'])->toBe(1);
    expect($row['utilization_rate'])->toBeGreaterThan(0);
});

/* Manager performance report - data assertions */
it('returns manager rows in manager-performance report', function () {
    $admin = User::factory()->create();
    $manager = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'manager_id' => $manager->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
        'total_cost' => 200.00,
    ]);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/reports/manager-performance')
        ->assertSuccessful();

    $managers = $response->json('data.managers');
    expect($managers)->not->toBeEmpty();
    expect($managers[0]['manager']['id'])->toBe($manager->id);
    expect($managers[0]['total_rentals'])->toBe(1);
    expect($managers[0]['completed_rentals'])->toBe(1);
    expect((float) $managers[0]['total_revenue'])->toBe(200.0);
});

it('ignores rentals without a manager in manager-performance report', function () {
    $user = User::factory()->create();

    Rental::factory()->create([
        'manager_id' => null,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(2)->toDateString(),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/manager-performance')
        ->assertSuccessful();

    expect($response->json('data.managers'))->toBeEmpty();
});

/* Outstanding payments report - data assertions */
it('returns partially_paid rentals in outstanding-payments report', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    Rental::factory()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'status' => 'active',
        'payment_status' => 'partially_paid',
        'pickup_date' => now()->subDays(3)->toDateString(),
        'return_date' => now()->addDays(2)->toDateString(),
        'total_cost' => 400.00,
        'amount_paid' => 100.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/outstanding-payments')
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['rentals'])->not->toBeEmpty();
    expect((float) $data['summary']['total_outstanding'])->toBe(300.0);
    expect($data['summary']['partial_count'])->toBe(1);
    expect($data['summary']['pending_count'])->toBe(0);
});

it('excludes cancelled rentals from outstanding-payments report', function () {
    $user = User::factory()->create();

    Rental::factory()->cancelled()->create([
        'payment_status' => 'pending',
        'total_cost' => 300.00,
        'amount_paid' => 0,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/outstanding-payments')
        ->assertSuccessful();

    expect($response->json('data.rentals'))->toBeEmpty();
});

/* Maintenance report - damage_reports assertions */
it('returns damage_reports when a return inspection has damage_noted true', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'pickup_date' => now()->subDays(7)->toDateString(),
        'return_date' => now()->subDays(1)->toDateString(),
        'estimated_repair_cost' => 250.00,
        'actual_repair_cost' => 300.00,
        'has_damage' => true,
    ]);

    RentalInspection::create([
        'rental_id' => $rental->id,
        'type' => 'return',
        'damage_noted' => true,
        'damage_types' => ['scratch', 'dent'],
        'damage_severity' => 'minor',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/maintenance')
        ->assertSuccessful();

    $data = $response->json('data');
    expect($data['damage_reports'])->not->toBeEmpty();
    expect($data['summary']['damage_reports_count'])->toBe(1);
    expect((float) $data['summary']['total_estimated_damage'])->toBe(250.0);
    expect((float) $data['summary']['total_actual_damage'])->toBe(300.0);
});

it('does not include pickup inspections in damage_reports', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->active()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
    ]);

    RentalInspection::create([
        'rental_id' => $rental->id,
        'type' => 'pickup',
        'damage_noted' => true,
        'damage_types' => ['scratch'],
        'damage_severity' => 'minor',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/maintenance')
        ->assertSuccessful();

    expect($response->json('data.damage_reports'))->toBeEmpty();
});

/* Customer analysis report - top_customers assertions */
it('returns top_customers in customer-analysis report', function () {
    Cache::flush();

    $user = User::factory()->create();
    $customer = Customer::factory()->create();

    Rental::factory()->completed()->create([
        'customer_id' => $customer->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(3)->toDateString(),
        'total_cost' => 600.00,
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/customer-analysis')
        ->assertSuccessful();

    $topCustomers = $response->json('data.top_customers');
    expect($topCustomers)->not->toBeEmpty();

    $row = collect($topCustomers)->firstWhere('id', $customer->id);
    expect($row)->not->toBeNull();
    expect($row['rentals_count'])->toBe(1);
    expect((float) $row['total_spend'])->toBe(600.0);
});

/* PDF export - all report types supported */
it('can export vehicles report as pdf', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/vehicles/export/pdf');
    expect($response->status())->toBeIn([200, 204]);
});

it('can export outstanding-payments report as pdf', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/outstanding-payments/export/pdf');
    expect($response->status())->toBeIn([200, 204]);
});

it('can export vehicle-expenses report as pdf', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/vehicle-expenses/export/pdf');
    expect($response->status())->toBeIn([200, 204]);
});

/* Revenue chart_period grouping */
it('groups revenue chart by weekly period when chart_period=weekly', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(3)->toDateString(),
        'total_cost' => 300.00,
        'amount_paid' => 300.00,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rental->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue?start_date=' . now()->startOfMonth()->toDateString() . '&end_date=' . now()->endOfMonth()->toDateString() . '&chart_period=weekly')
        ->assertSuccessful();

    $chart = $response->json('data.chart');
    expect($chart)->toBeArray()->not->toBeEmpty();

    $row = $chart[0];
    expect($row)->toHaveKey('period_label');
    expect($row)->toHaveKey('revenue');
    expect($row)->toHaveKey('transaction_count');
});

it('groups revenue chart by monthly period when chart_period=monthly', function () {
    $user = User::factory()->create();
    $vehicle = Vehicle::factory()->create();
    $customer = Customer::factory()->create();

    $rental = Rental::factory()->completed()->create([
        'vehicle_id' => $vehicle->id,
        'customer_id' => $customer->id,
        'pickup_date' => now()->startOfMonth()->toDateString(),
        'return_date' => now()->startOfMonth()->addDays(3)->toDateString(),
        'total_cost' => 400.00,
        'amount_paid' => 400.00,
    ]);

    PaymentTransaction::factory()->paid()->create([
        'amount' => 400.00,
        'paid_at' => now()->startOfMonth(),
        'transactable_id' => $rental->id,
        'transactable_type' => 'rental',
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue?start_date=' . now()->startOfMonth()->toDateString() . '&end_date=' . now()->endOfMonth()->toDateString() . '&chart_period=monthly')
        ->assertSuccessful();

    $chart = $response->json('data.chart');
    expect($chart)->toBeArray()->not->toBeEmpty();

    $row = $chart[0];
    expect($row)->toHaveKey('period_label');
    expect((float) $row['revenue'])->toBe(400.0);
});

it('rejects invalid chart_period value', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/reports/revenue?chart_period=invalid')
        ->assertUnprocessable();
});
