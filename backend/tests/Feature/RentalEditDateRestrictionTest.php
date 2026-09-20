<?php

use App\Enums\RentalStatus;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers */

function grantRentalEditForDateTest(User $user): void
{
    $permission = Permission::firstOrCreate(['name' => 'rentals.edit', 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

/* Tests */

it('allows editing dates on pending rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create([
        'status' => RentalStatus::Pending,
        'pickup_date' => '2027-01-10',
        'return_date' => '2027-01-15',
    ]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_date' => '2027-01-12',
            'return_date' => '2027-01-18',
        ])
        ->assertSuccessful();
});

it('blocks editing dates on confirmed rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create(['status' => RentalStatus::Confirmed]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_date' => '2027-01-15',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['pickup_date']);
});

it('blocks editing dates on active rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create(['status' => RentalStatus::Active]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'return_date' => '2027-01-20',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['return_date']);
});

it('blocks editing dates on overdue rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create(['status' => RentalStatus::Overdue]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'pickup_time' => '09:00',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['pickup_time']);
});

it('allows editing non-date fields on confirmed rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create(['status' => RentalStatus::Confirmed]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'admin_notes' => 'Updated note',
            'source' => 'phone',
        ])
        ->assertSuccessful();
});

it('allows editing non-date fields on active rental', function () {
    $user = User::factory()->create();
    grantRentalEditForDateTest($user);
    $rental = Rental::factory()->create(['status' => RentalStatus::Active]);

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/rentals/{$rental->id}", [
            'customer_notes' => 'Customer updated note',
        ])
        ->assertSuccessful();
});
