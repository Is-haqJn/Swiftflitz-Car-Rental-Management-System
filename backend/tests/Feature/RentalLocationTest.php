<?php

use App\Models\Branch;
use App\Models\RentalLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */
function makeAdmin(): User
{
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create()->assignRole($role);

    foreach (['rentals.manage_locations', 'rentals.view_all'] as $perm) {
        Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
    }
    $user->givePermissionTo(['rentals.manage_locations', 'rentals.view_all']);

    return $user;
}

function makeManager(): User
{
    $role = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
    $user = User::factory()->create()->assignRole($role);

    Permission::firstOrCreate(['name' => 'rentals.manage_locations', 'guard_name' => 'web']);
    $user->givePermissionTo('rentals.manage_locations');

    return $user;
}

/* Index */
it('admin can list all rental locations', function () {
    $branch = Branch::factory()->create();
    RentalLocation::factory(3)->create(['branch_id' => $branch->id]);

    $this->actingAs(makeAdmin(), 'sanctum')
        ->getJson('/api/v1/rental-locations')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('manager only sees locations for their branches', function () {
    $manager = makeManager();
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($myBranch);

    RentalLocation::factory(2)->create(['branch_id' => $myBranch->id]);
    RentalLocation::factory(3)->create(['branch_id' => $otherBranch->id]);

    $this->actingAs($manager, 'sanctum')
        ->getJson('/api/v1/rental-locations')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

/* Store */
it('admin can create a rental location', function () {
    $branch = Branch::factory()->create();

    $this->actingAs(makeAdmin(), 'sanctum')
        ->postJson('/api/v1/rental-locations', [
            'branch_id' => $branch->id,
            'name' => 'Accra Airport',
            'pickup_charge' => 50.00,
            'dropoff_charge' => null,
            'is_default' => false,
            'is_pickup' => true,
            'is_dropoff' => true,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Accra Airport')
        ->assertJsonPath('data.pickup_charge', 50);

    expect(RentalLocation::where('name', 'Accra Airport')->exists())->toBeTrue();
});

it('manager can create a location for their own branch', function () {
    $manager = makeManager();
    $branch = Branch::factory()->create();
    $manager->branches()->attach($branch);

    $this->actingAs($manager, 'sanctum')
        ->postJson('/api/v1/rental-locations', [
            'branch_id' => $branch->id,
            'name' => 'Office Pickup',
            'is_pickup' => true,
            'is_dropoff' => true,
            'is_active' => true,
        ])
        ->assertCreated();
});

it('manager cannot create a location for another branch', function () {
    $manager = makeManager();
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($myBranch);

    $this->actingAs($manager, 'sanctum')
        ->postJson('/api/v1/rental-locations', [
            'branch_id' => $otherBranch->id,
            'name' => 'Sneaky Location',
            'is_pickup' => true,
            'is_dropoff' => true,
            'is_active' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['branch_id']);
});

it('setting is_default unsets the previous default for that branch', function () {
    $branch = Branch::factory()->create();
    $existing = RentalLocation::factory()->create([
        'branch_id' => $branch->id,
        'is_default' => true,
    ]);

    $this->actingAs(makeAdmin(), 'sanctum')
        ->postJson('/api/v1/rental-locations', [
            'branch_id' => $branch->id,
            'name' => 'New Default',
            'is_default' => true,
            'is_pickup' => true,
            'is_dropoff' => true,
            'is_active' => true,
        ])
        ->assertCreated();

    expect($existing->fresh()->is_default)->toBeFalse();
    expect(RentalLocation::where('branch_id', $branch->id)->where('is_default', true)->count())->toBe(1);
});

/* Show */
it('admin can view a rental location', function () {
    $location = RentalLocation::factory()->create();

    $this->actingAs(makeAdmin(), 'sanctum')
        ->getJson("/api/v1/rental-locations/{$location->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $location->id);
});

/* Update */
it('admin can update a rental location', function () {
    $location = RentalLocation::factory()->create(['name' => 'Old Name']);

    $this->actingAs(makeAdmin(), 'sanctum')
        ->putJson("/api/v1/rental-locations/{$location->id}", [
            'name' => 'New Name',
            'is_active' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.is_active', false);
});

it('manager can update a location in their branch', function () {
    $manager = makeManager();
    $branch = Branch::factory()->create();
    $manager->branches()->attach($branch);
    $location = RentalLocation::factory()->create(['branch_id' => $branch->id]);

    $this->actingAs($manager, 'sanctum')
        ->putJson("/api/v1/rental-locations/{$location->id}", [
            'name' => 'Updated Name',
        ])
        ->assertOk();
});

it('manager cannot update a location from another branch', function () {
    $manager = makeManager();
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($myBranch);
    $location = RentalLocation::factory()->create(['branch_id' => $otherBranch->id]);

    $this->actingAs($manager, 'sanctum')
        ->putJson("/api/v1/rental-locations/{$location->id}", ['name' => 'Hack'])
        ->assertForbidden();
});

/* Delete */
it('admin can delete a rental location', function () {
    $location = RentalLocation::factory()->create();

    $this->actingAs(makeAdmin(), 'sanctum')
        ->deleteJson("/api/v1/rental-locations/{$location->id}")
        ->assertNoContent();

    expect(RentalLocation::find($location->id))->toBeNull();
});

it('manager cannot delete a location from another branch', function () {
    $manager = makeManager();
    $myBranch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();
    $manager->branches()->attach($myBranch);
    $location = RentalLocation::factory()->create(['branch_id' => $otherBranch->id]);

    $this->actingAs($manager, 'sanctum')
        ->deleteJson("/api/v1/rental-locations/{$location->id}")
        ->assertForbidden();
});

/* Filters */
it('can filter locations by branch', function () {
    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();
    RentalLocation::factory(2)->create(['branch_id' => $branch1->id]);
    RentalLocation::factory(3)->create(['branch_id' => $branch2->id]);

    $this->actingAs(makeAdmin(), 'sanctum')
        ->getJson("/api/v1/rental-locations?filter[branch_id]={$branch1->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('can filter locations by active status', function () {
    $branch = Branch::factory()->create();
    RentalLocation::factory(2)->create(['branch_id' => $branch->id, 'is_active' => true]);
    RentalLocation::factory(1)->create(['branch_id' => $branch->id, 'is_active' => false]);

    $this->actingAs(makeAdmin(), 'sanctum')
        ->getJson('/api/v1/rental-locations?filter[is_active]=1')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});
