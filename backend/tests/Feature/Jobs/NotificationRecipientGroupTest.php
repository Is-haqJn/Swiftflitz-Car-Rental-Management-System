<?php

use App\Jobs\SendBookingConfirmationJob;
use App\Models\AppNotification;
use App\Models\Branch;
use App\Models\Rental;
use App\Models\User;
use App\Settings\NotificationSystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helper: create a permission if it does not exist and grant it to a user */
function recipientGroupGrant(User $user, string $permission): void
{
    Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

/* Helper: configure NotificationSystemSettings toggles */
function setInappToggles(bool $branchManagers, bool $admins): void
{
    $settings = app(NotificationSystemSettings::class);
    $settings->inapp_notify_branch_managers = $branchManagers;
    $settings->inapp_notify_admins = $admins;
    $settings->save();
}

it('resolveStaffIds separates branch managers from global admins', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    /* Branch manager: has view_own + assigned to branch */
    $branchManager = User::factory()->create();
    recipientGroupGrant($branchManager, 'rentals.view_own');
    $branchManager->branches()->attach($branch->id);

    /* Global admin: has view_all + NO branch */
    $globalAdmin = User::factory()->create();
    recipientGroupGrant($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => null,
    ]);

    SendBookingConfirmationJob::dispatchSync($rental);

    /* Both should receive an in-app notification */
    expect(AppNotification::where('user_id', $branchManager->id)->where('type', 'booking_created')->count())->toBe(1);
    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'booking_created')->count())->toBe(1);
});

it('dedupes a user who has both branch assignment and global permission', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    /* This user has view_all AND is assigned to the branch - classic dedup scenario */
    $dualUser = User::factory()->create();
    recipientGroupGrant($dualUser, 'rentals.view_all');
    $dualUser->branches()->attach($branch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => null,
    ]);

    SendBookingConfirmationJob::dispatchSync($rental);

    /* User should receive exactly one notification, not two */
    expect(AppNotification::where('user_id', $dualUser->id)->where('type', 'booking_created')->count())->toBe(1);
});

it('does not send in-app to branch managers when inapp_notify_branch_managers is false', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $branchManager = User::factory()->create();
    recipientGroupGrant($branchManager, 'rentals.view_own');
    $branchManager->branches()->attach($branch->id);

    $globalAdmin = User::factory()->create();
    recipientGroupGrant($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create(['branch_id' => $branch->id, 'manager_id' => null]);

    setInappToggles(branchManagers: false, admins: true);

    SendBookingConfirmationJob::dispatchSync($rental);

    expect(AppNotification::where('user_id', $branchManager->id)->where('type', 'booking_created')->count())->toBe(0);
    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'booking_created')->count())->toBe(1);
});

it('does not send in-app to admins when inapp_notify_admins is false', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $branchManager = User::factory()->create();
    recipientGroupGrant($branchManager, 'rentals.view_own');
    $branchManager->branches()->attach($branch->id);

    $globalAdmin = User::factory()->create();
    recipientGroupGrant($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create(['branch_id' => $branch->id, 'manager_id' => null]);

    setInappToggles(branchManagers: true, admins: false);

    SendBookingConfirmationJob::dispatchSync($rental);

    expect(AppNotification::where('user_id', $branchManager->id)->where('type', 'booking_created')->count())->toBe(1);
    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'booking_created')->count())->toBe(0);
});

it('notifies both groups when both in-app toggles are true', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $branchManager = User::factory()->create();
    recipientGroupGrant($branchManager, 'rentals.view_own');
    $branchManager->branches()->attach($branch->id);

    $globalAdmin = User::factory()->create();
    recipientGroupGrant($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create(['branch_id' => $branch->id, 'manager_id' => null]);

    setInappToggles(branchManagers: true, admins: true);

    SendBookingConfirmationJob::dispatchSync($rental);

    expect(AppNotification::where('user_id', $branchManager->id)->where('type', 'booking_created')->count())->toBe(1);
    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'booking_created')->count())->toBe(1);
});

it('notifies neither group when both in-app toggles are false', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $branchManager = User::factory()->create();
    recipientGroupGrant($branchManager, 'rentals.view_own');
    $branchManager->branches()->attach($branch->id);

    $globalAdmin = User::factory()->create();
    recipientGroupGrant($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create(['branch_id' => $branch->id, 'manager_id' => null]);

    setInappToggles(branchManagers: false, admins: false);

    SendBookingConfirmationJob::dispatchSync($rental);

    expect(AppNotification::where('user_id', $branchManager->id)->where('type', 'booking_created')->count())->toBe(0);
    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'booking_created')->count())->toBe(0);
});
