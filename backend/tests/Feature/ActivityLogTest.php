<?php

use App\Enums\RoleEnum;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (RoleEnum::cases() as $role) {
        Role::create(['name' => $role->value, 'guard_name' => 'web']);
    }
});

/* Activity Logging */
it('logs activity when a vehicle is created', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $vehicle = Vehicle::factory()->create();

    $log = Activity::where('subject_type', Vehicle::class)
        ->where('subject_id', $vehicle->id)
        ->where('event', 'created')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('vehicle')
        ->and($log->description)->toContain('was created');
});

it('logs activity when a customer is updated', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $customer = Customer::factory()->create();
    $customer->update(['name' => 'Updated Name']);

    $log = Activity::where('subject_type', Customer::class)
        ->where('subject_id', $customer->id)
        ->where('event', 'updated')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('customer')
        ->and($log->properties['old'])->toHaveKey('name')
        ->and($log->properties['attributes']['name'])->toBe('Updated Name');
});

it('logs activity when a category is deleted', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $category = Category::factory()->create();
    $categoryId = $category->id;
    $category->delete();

    $log = Activity::where('subject_type', Category::class)
        ->where('subject_id', $categoryId)
        ->where('event', 'deleted')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('category');
});

/* Super Admin Exclusion */
it('does not log activity for super admin users via middleware', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole(RoleEnum::SUPER_ADMIN->value);

    $category = Category::factory()->create();

    // Clear any creation logs
    Activity::query()->delete();

    $this->actingAs($superAdmin, 'sanctum')
        ->putJson("/api/v1/categories/{$category->id}", [
            'name' => 'Super Admin Updated',
            'slug' => 'super-admin-updated',
        ])
        ->assertSuccessful();

    $log = Activity::where('subject_type', Category::class)
        ->where('subject_id', $category->id)
        ->where('event', 'updated')
        ->first();

    expect($log)->toBeNull();
});

it('logs activity for non-super-admin users via middleware', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $category = Category::factory()->create();

    // Clear any creation logs
    Activity::query()->delete();

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/categories/{$category->id}", [
            'name' => 'Admin Updated',
            'slug' => 'admin-updated',
        ])
        ->assertSuccessful();

    $log = Activity::where('subject_type', Category::class)
        ->where('subject_id', $category->id)
        ->where('event', 'updated')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->causer_id)->toBe($admin->id);
});

/* User Sensitive Fields */
it('does not log sensitive user fields like password', function () {
    $admin = User::factory()->create();
    $admin->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($admin, 'sanctum');

    $user = User::factory()->create();
    $user->update(['password' => 'new-secret-password']);

    $logs = Activity::where('subject_type', User::class)
        ->where('subject_id', $user->id)
        ->get();

    foreach ($logs as $log) {
        if ($log->properties->has('attributes')) {
            expect($log->properties['attributes'])->not->toHaveKey('password');
        }

        if ($log->properties->has('old')) {
            expect($log->properties['old'])->not->toHaveKey('password');
        }
    }
});

/* Rental Activity Logging */
it('logs activity when a rental is created', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $rental = Rental::factory()->create();

    $log = Activity::where('subject_type', 'rental')
        ->where('subject_id', $rental->id)
        ->where('event', 'created')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('rental')
        ->and($log->description)->toContain("Rental {$rental->reference} was created");
});

it('logs activity when a rental is updated', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $rental = Rental::factory()->create();

    // Clear creation log
    Activity::query()->delete();

    $rental->update(['amount_paid' => 100.00]);

    $log = Activity::where('subject_type', 'rental')
        ->where('subject_id', $rental->id)
        ->where('event', 'updated')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('rental')
        ->and($log->description)->toContain("Rental {$rental->reference} was updated")
        ->and((float) $log->properties['attributes']['amount_paid'])->toBe(100.0);
});

it('logs activity when a rental is deleted', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $rental = Rental::factory()->create();
    $rentalId = $rental->id;
    $reference = $rental->reference;

    // Clear creation log
    Activity::query()->delete();

    $rental->delete();

    $log = Activity::where('subject_type', 'rental')
        ->where('subject_id', $rentalId)
        ->where('event', 'deleted')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->log_name)->toBe('rental')
        ->and($log->description)->toContain("Rental {$reference} was deleted");
});

it('does not log dirty rental fields when no changes are made', function () {
    $user = User::factory()->create();
    $user->assignRole(RoleEnum::ADMIN->value);

    $this->actingAs($user, 'sanctum');

    $rental = Rental::factory()->create();

    // Clear creation log
    Activity::query()->delete();

    $rental->save();

    $log = Activity::where('subject_type', 'rental')
        ->where('subject_id', $rental->id)
        ->where('event', 'updated')
        ->first();

    expect($log)->toBeNull();
});
