<?php

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */

function paymentManagerUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('manager', 'web');
    $user->assignRole($role);
    Permission::firstOrCreate(['name' => 'rentals.view_all', 'guard_name' => 'web']);
    $user->givePermissionTo('rentals.view_all');

    return $user;
}

function makeRentalForBranch(Branch $branch): Rental
{
    return Rental::factory()->create([
        'customer_id' => Customer::factory()->create()->id,
        'branch_id' => $branch->id,
    ]);
}

/* GET /api/v1/payments/payable-amount - public route */

it('unauthenticated request can call payable-amount (UUID is access control)', function () {
    $rental = Rental::factory()->create([
        'customer_id' => Customer::factory()->create()->id,
    ]);

    /* No actingAs - simulates customer on public payment page */
    $response = $this->getJson('/api/v1/payments/payable-amount?' . http_build_query([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
    ]));

    expect($response->status())->not->toBe(403);
});

it('authenticated manager is forbidden from fetching payable amount for rental outside their branch', function () {
    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    $manager = paymentManagerUser();
    $manager->branches()->attach($branchA);

    $rental = makeRentalForBranch($branchB);

    $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/payments/payable-amount?' . http_build_query([
            'transactable_type' => 'rental',
            'transactable_id' => $rental->id,
        ]))
        ->assertForbidden();
});

it('authenticated admin can fetch payable amount for any rental regardless of branch', function () {
    $rental = makeRentalForBranch(Branch::factory()->create());

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->getJson('/api/v1/payments/payable-amount?' . http_build_query([
            'transactable_type' => 'rental',
            'transactable_id' => $rental->id,
        ]));

    expect($response->status())->not->toBe(403);
});
