<?php

use App\Enums\RentalStatus;
use App\Models\Branch;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/*
 * Helper: create an NGN branch (exchange_rate = 0.085) and a GHS branch.
 * Returns ['ngn' => Branch, 'ghs' => Branch].
 */
function createTestBranches(): array
{
    $ngn = Branch::factory()->create([
        'name' => 'Lagos Branch',
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'exchange_rate' => 0.085,
    ]);

    $ghs = Branch::factory()->create([
        'name' => 'Accra Branch',
        'currency' => 'GHS',
        'currency_symbol' => '₵',
        'exchange_rate' => 1.0,
    ]);

    return ['ngn' => $ngn, 'ghs' => $ghs];
}

/*
 * Helper: create a manager user assigned to the given branches.
 */
function createManagerWithBranches(array $branches): User
{
    $manager = User::factory()->create();
    $role = Role::findOrCreate('manager');
    $manager->assignRole($role);

    $permission = Permission::findOrCreate('dashboard.view');
    $manager->givePermissionTo($permission);

    foreach ($branches as $branch) {
        $manager->branches()->attach($branch->id);
    }

    return $manager;
}

/* Dashboard - revenue_this_month FX conversion */

it('dashboard revenue_this_month applies FX for multi-branch manager scope', function () {
    Cache::flush();
    $branches = createTestBranches();

    $rental = Rental::factory()->create([
        'branch_id' => $branches['ngn']->id,
        'status' => RentalStatus::Completed->value,
    ]);

    /* NGN transaction: ₦100 at rate 0.085 → GHS 8.50 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 100.00,
        'exchange_rate' => 0.085,
        'currency' => 'NGN',
        'branch_id' => $branches['ngn']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'paid_at' => now(),
    ]);

    $manager = createManagerWithBranches([$branches['ngn'], $branches['ghs']]);

    $data = $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    /* Must be ~8.50, not 100.00 */
    expect((float) $data['revenue']['this_month'])->toBeGreaterThan(8.0)
        ->and((float) $data['revenue']['this_month'])->toBeLessThan(9.0);
});

it('dashboard revenue_this_month does not double-count GHS branch amounts', function () {
    Cache::flush();
    $branches = createTestBranches();

    $rental = Rental::factory()->create([
        'branch_id' => $branches['ghs']->id,
        'status' => RentalStatus::Completed->value,
    ]);

    /* GHS transaction: ₵200 at rate 1.0 → GHS 200 (unchanged) */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 200.00,
        'exchange_rate' => 1.0,
        'currency' => 'GHS',
        'branch_id' => $branches['ghs']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'paid_at' => now(),
    ]);

    $manager = createManagerWithBranches([$branches['ngn'], $branches['ghs']]);

    $data = $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    /* GHS amount should remain 200.00 */
    expect((float) $data['revenue']['this_month'])->toBe(200.0);
});

it('dashboard revenue_this_month sums FX-converted amounts across mixed branches', function () {
    Cache::flush();
    $branches = createTestBranches();

    $ngnRental = Rental::factory()->create([
        'branch_id' => $branches['ngn']->id,
        'status' => RentalStatus::Completed->value,
    ]);
    $ghsRental = Rental::factory()->create([
        'branch_id' => $branches['ghs']->id,
        'status' => RentalStatus::Completed->value,
    ]);

    /* NGN: ₦100 * 0.085 = GHS 8.50 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 100.00,
        'exchange_rate' => 0.085,
        'currency' => 'NGN',
        'branch_id' => $branches['ngn']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $ngnRental->id,
        'paid_at' => now(),
    ]);

    /* GHS: ₵200 * 1.0 = GHS 200 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 200.00,
        'exchange_rate' => 1.0,
        'currency' => 'GHS',
        'branch_id' => $branches['ghs']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $ghsRental->id,
        'paid_at' => now(),
    ]);

    $manager = createManagerWithBranches([$branches['ngn'], $branches['ghs']]);

    $data = $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/dashboard')
        ->assertSuccessful()
        ->json('data');

    /* Expected total: 8.50 + 200 = 208.50 */
    expect((float) $data['revenue']['this_month'])->toBe(208.50);
});

/* Revenue report - collected_revenue FX conversion */

it('revenue report collected_revenue applies FX for multi-branch scope', function () {
    Cache::flush();
    $branches = createTestBranches();

    $rental = Rental::factory()->create([
        'branch_id' => $branches['ngn']->id,
        'status' => RentalStatus::Completed->value,
        'pickup_date' => now()->toDateString(),
    ]);

    /* NGN: ₦1000 * 0.085 = GHS 85 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 1000.00,
        'exchange_rate' => 0.085,
        'currency' => 'NGN',
        'branch_id' => $branches['ngn']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'paid_at' => now(),
    ]);

    $manager = createManagerWithBranches([$branches['ngn'], $branches['ghs']]);

    $start = now()->startOfMonth()->toDateString();
    $end = now()->endOfMonth()->toDateString();

    $data = $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/reports/revenue?start_date={$start}&end_date={$end}")
        ->assertSuccessful()
        ->json('data');

    /* Must be ~85, not 1000 */
    expect((float) $data['summary']['collected_revenue'])->toBeGreaterThan(84.0)
        ->and((float) $data['summary']['collected_revenue'])->toBeLessThan(86.0);
});

it('revenue report collected_revenue sums FX-converted amounts across mixed branches', function () {
    Cache::flush();
    $branches = createTestBranches();

    $ngnRental = Rental::factory()->create([
        'branch_id' => $branches['ngn']->id,
        'status' => RentalStatus::Completed->value,
        'pickup_date' => now()->toDateString(),
    ]);
    $ghsRental = Rental::factory()->create([
        'branch_id' => $branches['ghs']->id,
        'status' => RentalStatus::Completed->value,
        'pickup_date' => now()->toDateString(),
    ]);

    /* NGN: ₦1000 * 0.085 = GHS 85 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 1000.00,
        'exchange_rate' => 0.085,
        'currency' => 'NGN',
        'branch_id' => $branches['ngn']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $ngnRental->id,
        'paid_at' => now(),
    ]);

    /* GHS: ₵300 * 1.0 = GHS 300 */
    PaymentTransaction::factory()->paid()->create([
        'amount' => 300.00,
        'exchange_rate' => 1.0,
        'currency' => 'GHS',
        'branch_id' => $branches['ghs']->id,
        'transactable_type' => 'rental',
        'transactable_id' => $ghsRental->id,
        'paid_at' => now(),
    ]);

    $manager = createManagerWithBranches([$branches['ngn'], $branches['ghs']]);

    $start = now()->startOfMonth()->toDateString();
    $end = now()->endOfMonth()->toDateString();

    $data = $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/reports/revenue?start_date={$start}&end_date={$end}")
        ->assertSuccessful()
        ->json('data');

    /* Expected: 85 + 300 = 385 */
    expect((float) $data['summary']['collected_revenue'])->toBe(385.0);
});
