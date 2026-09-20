<?php

use App\Jobs\SendBookingConfirmationJob;
use App\Mail\BookingConfirmationMail;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Rental;
use App\Models\User;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers local to this file */
function bookingConfirmationGrantPerms(User $user, array $names): void
{
    foreach ($names as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }
    $user->givePermissionTo($names);
}

it('does not notify a branch-scoped manager for a booking in a different branch', function () {
    Mail::fake();

    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    $managerA = User::factory()->create();
    bookingConfirmationGrantPerms($managerA, ['rentals.view_own']);
    $managerA->branches()->attach($branchA->id);

    /* Booking belongs to Branch B */
    $rental = Rental::factory()->create(['branch_id' => $branchB->id]);

    SendBookingConfirmationJob::dispatchSync($rental);

    $this->assertDatabaseMissing('app_notifications', [
        'user_id' => $managerA->id,
        'type' => 'booking_created',
    ]);
});

it('notifies a branch-scoped manager for a booking in their own branch', function () {
    Mail::fake();

    $branch = Branch::factory()->create();

    $manager = User::factory()->create();
    bookingConfirmationGrantPerms($manager, ['rentals.view_own']);
    $manager->branches()->attach($branch->id);

    $rental = Rental::factory()->create(['branch_id' => $branch->id]);

    SendBookingConfirmationJob::dispatchSync($rental);

    $this->assertDatabaseHas('app_notifications', [
        'user_id' => $manager->id,
        'type' => 'booking_created',
    ]);
});

it('notifies a global admin with rentals.view_all regardless of branch', function () {
    Mail::fake();

    $branchA = Branch::factory()->create();
    $branchB = Branch::factory()->create();

    /* Global admin - has view_all but belongs to NO branch */
    $globalAdmin = User::factory()->create();
    bookingConfirmationGrantPerms($globalAdmin, ['rentals.view_all']);

    /* Booking in Branch B - global admin has no branch assignment */
    $rental = Rental::factory()->create(['branch_id' => $branchB->id]);

    SendBookingConfirmationJob::dispatchSync($rental);

    $this->assertDatabaseHas('app_notifications', [
        'user_id' => $globalAdmin->id,
        'type' => 'booking_created',
    ]);

    /* Unrelated branch A should not affect outcome */
    unset($branchA);
});

it('always notifies the assigned manager_id regardless of branch or permissions', function () {
    Mail::fake();

    $branch = Branch::factory()->create();
    $otherBranch = Branch::factory()->create();

    /* assignedManager belongs to otherBranch only, not the rental branch */
    $assignedManager = User::factory()->create();
    $assignedManager->branches()->attach($otherBranch->id);

    $rental = Rental::factory()->create([
        'branch_id' => $branch->id,
        'manager_id' => $assignedManager->id,
    ]);

    SendBookingConfirmationJob::dispatchSync($rental);

    $this->assertDatabaseHas('app_notifications', [
        'user_id' => $assignedManager->id,
        'type' => 'booking_created',
    ]);
});

it('sends payment link email for pending website booking', function (): void {
    Mail::fake();

    $this->mock(NotificationServiceInterface::class)
        ->shouldReceive('send')->andReturn(null);
    $this->mock(WhatsAppNotificationServiceInterface::class)
        ->shouldReceive('notifyNewBooking', 'notifyAdminNewBooking')->andReturn(null);
    $this->mock(SmsNotificationServiceInterface::class)
        ->shouldReceive('notifyNewBooking', 'notifyAdminNewBooking')->andReturn(null);

    $customer = Customer::factory()->create(['email' => 'website@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'source' => 'website',
        'payment_status' => 'pending',
        'total_cost' => 500.00,
        'amount_paid' => 0.00,
    ]);

    SendBookingConfirmationJob::dispatchSync($rental);

    Mail::assertQueued(BookingConfirmationMail::class, function ($mail) {
        return $mail->paymentUrl !== null && $mail->amountDue > 0;
    });
});

it('sends plain booking confirmed email for in-store admin rental', function (): void {
    Mail::fake();

    $this->mock(NotificationServiceInterface::class)
        ->shouldReceive('send')->andReturn(null);
    $this->mock(WhatsAppNotificationServiceInterface::class)
        ->shouldReceive('notifyNewBooking', 'notifyAdminNewBooking')->andReturn(null);
    $this->mock(SmsNotificationServiceInterface::class)
        ->shouldReceive('notifyNewBooking', 'notifyAdminNewBooking')->andReturn(null);

    $customer = Customer::factory()->create(['email' => 'instore@example.com']);
    $rental = Rental::factory()->create([
        'customer_id' => $customer->id,
        'source' => 'walk_in',
        'payment_status' => 'paid',
        'status' => 'confirmed',
    ]);

    SendBookingConfirmationJob::dispatchSync($rental);

    Mail::assertQueued(BookingConfirmationMail::class, fn ($m) => $m->paymentUrl === null);
});
