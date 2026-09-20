<?php

use App\Jobs\SendReturnReminderJob;
use App\Models\AppNotification;
use App\Models\Branch;
use App\Models\Rental;
use App\Models\User;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function returnReminderGrantPermission(User $user, string $permission): void
{
    Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

it('notifies users with rentals.view_all permission in the rental branch', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $branchUser = User::factory()->create();
    returnReminderGrantPermission($branchUser, 'rentals.view_all');
    $branchUser->branches()->attach($branch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => null,
    ]);

    $job = new SendReturnReminderJob($rental);
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(AppNotification::where('user_id', $branchUser->id)->where('type', 'return_reminder')->count())->toBe(1);
});

it('always notifies the assigned rental manager_id regardless of permissions', function () {
    Mail::fake();

    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    /* Manager is in a different branch with no rental permissions */
    $assignedManager = User::factory()->create();
    $assignedManager->branches()->attach($otherBranch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => $assignedManager->id,
    ]);

    $job = new SendReturnReminderJob($rental);
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(AppNotification::where('user_id', $assignedManager->id)->where('type', 'return_reminder')->count())->toBe(1);
});

it('does not notify users from other branches', function () {
    Mail::fake();

    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    $branchAUser = User::factory()->create();
    returnReminderGrantPermission($branchAUser, 'rentals.view_all');
    $branchAUser->branches()->attach($branchA->id);

    /* Rental belongs to Branch B */
    $rental = Rental::factory()->create([
        'branch_id' => $branchB->id,
        'manager_id' => null,
    ]);

    $job = new SendReturnReminderJob($rental);
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(AppNotification::where('user_id', $branchAUser->id)->where('type', 'return_reminder')->count())->toBe(0);
});

it('notifies global admin with rentals.view_all and no branch assignment', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $globalAdmin = User::factory()->create();
    returnReminderGrantPermission($globalAdmin, 'rentals.view_all');

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => null,
    ]);

    $job = new SendReturnReminderJob($rental);
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(AppNotification::where('user_id', $globalAdmin->id)->where('type', 'return_reminder')->count())->toBe(1);
});
