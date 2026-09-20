<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */

function branchManagerUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('manager', 'web');
    $user->assignRole($role);
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('transactions.view_all');

    return $user;
}

function branchAdminUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('admin', 'web');
    $user->assignRole($role);
    Permission::firstOrCreate(['name' => 'transactions.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('transactions.view_all');

    return $user;
}

function rentalManagerUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('manager', 'web');
    $user->assignRole($role);
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('rentals.view_all');

    return $user;
}

function rentalAdminUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('admin', 'web');
    $user->assignRole($role);
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('rentals.view_all');

    return $user;
}

/* PaymentTransactionPolicy branch scope */

it('manager can view a transaction belonging to their branch', function () {
    $branch = Branch::factory()->create();
    $manager = branchManagerUser();
    $manager->branches()->attach($branch->id);

    $tx = PaymentTransaction::factory()->create([
        'branch_id' => $branch->id,
        'transactable_type' => 'rental',
        'transactable_id' => Rental::factory()->create(['branch_id' => $branch->id])->id,
    ]);

    $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/transactions/{$tx->id}")
        ->assertOk();
});

it('manager cannot view a transaction from a different branch', function () {
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    $manager = branchManagerUser();
    $manager->branches()->attach($myBranch->id);

    $tx = PaymentTransaction::factory()->create([
        'branch_id' => $otherBranch->id,
        'transactable_type' => 'rental',
        'transactable_id' => Rental::factory()->create(['branch_id' => $otherBranch->id])->id,
    ]);

    $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/transactions/{$tx->id}")
        ->assertForbidden();
});

it('admin can view a transaction from any branch', function () {
    $branch = Branch::factory()->create();
    $admin = branchAdminUser();

    /* admin has NO branch assignment - should still see all transactions */

    $tx = PaymentTransaction::factory()->create([
        'branch_id' => $branch->id,
        'transactable_type' => 'rental',
        'transactable_id' => Rental::factory()->create(['branch_id' => $branch->id])->id,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->getJson("/api/v1/transactions/{$tx->id}")
        ->assertOk();
});

/* RentalPolicy view() branch scope */

it('manager can view a rental from their own branch', function () {
    $branch = Branch::factory()->create();
    $manager = rentalManagerUser();
    $manager->branches()->attach($branch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'customer_id' => Customer::factory()->create()->id,
    ]);

    $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertOk();
});

it('manager cannot view a rental from a different branch', function () {
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    $manager = rentalManagerUser();
    $manager->branches()->attach($myBranch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $otherBranch->id,
        'customer_id' => Customer::factory()->create()->id,
    ]);

    $this->actingAs($manager, 'sanctum')
        ->getJson("/api/v1/rentals/{$rental->id}")
        ->assertForbidden();
});
