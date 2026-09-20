<?php

use App\Jobs\CheckDriverDocumentExpiryJob;
use App\Jobs\SendPaymentConfirmationJob;
use App\Jobs\SendPickupReminderJob;
use App\Jobs\SendQuoteConfirmationJob;
use App\Jobs\SendUnderReviewNotificationJob;
use App\Jobs\SendVehicleExpiryNotificationJob;
use App\Models\AppNotification;
use App\Models\Branch;
use App\Models\Driver;
use App\Models\PaymentTransaction;
use App\Models\QuoteRequest;
use App\Models\Rental;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/*
 * Helper: create three scoped users for a given permission and two branches.
 * Returns [$kumasiUser, $lagosUser, $globalUser].
 */
function makeTrioForPermission(Branch $kumasi, Branch $lagos, string $permission): array
{
    Permission::findOrCreate($permission);

    $kumasiUser = User::factory()->create();
    $kumasiUser->givePermissionTo($permission);
    $kumasiUser->branches()->attach($kumasi->id);

    $lagosUser = User::factory()->create();
    $lagosUser->givePermissionTo($permission);
    $lagosUser->branches()->attach($lagos->id);

    $globalUser = User::factory()->create();
    $globalUser->givePermissionTo($permission);
    /* No branch attached - global scope */

    return [$kumasiUser, $lagosUser, $globalUser];
}

/*
 * Helper: count app_notifications for a given user.
 */
function notificationCount(User $user): int
{
    return AppNotification::where('user_id', $user->id)->count();
}

/* ─── 1. Pickup Reminder ─────────────────────────────────────────── */

it('pickup reminder does not notify users from other branches', function () {
    Mail::fake();

    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    [$kumasiUser, $lagosUser, $globalUser] = makeTrioForPermission($kumasi, $lagos, 'rentals.view_all');

    Permission::findOrCreate('rentals.view_own');

    /* Rental in Lagos branch, pickup tomorrow */
    $rental = Rental::factory()->confirmed()->create([
        'branch_id' => $lagos->id,
        'pickup_date' => now()->addDay()->format('Y-m-d'),
        'manager_id' => null,
    ]);

    /* Enable system-wide toggle */
    $settings = app(NotificationSystemSettings::class);
    $settings->pickup_reminder = true;
    $settings->save();

    $job = new SendPickupReminderJob;
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});

/* ─── 2. Payment Confirmation ────────────────────────────────────── */

it('payment confirmation does not notify users from other branches', function () {
    Mail::fake();

    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    [$kumasiUser, $lagosUser, $globalUser] = makeTrioForPermission($kumasi, $lagos, 'rentals.view_all');
    Permission::findOrCreate('rentals.view_own');

    $rental = Rental::factory()->create(['branch_id' => $lagos->id]);

    $transaction = PaymentTransaction::factory()->paid()->create([
        'transactable_type' => 'rental',
        'transactable_id' => $rental->id,
        'branch_id' => $lagos->id,
    ]);

    /* Enable system-wide toggle */
    $settings = app(NotificationSystemSettings::class);
    $settings->payment_confirmation = true;
    $settings->save();

    $job = new SendPaymentConfirmationJob($transaction);
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});

/* ─── 3. Under Review Notification ──────────────────────────────── */

it('under review notification does not notify users from other branches', function () {
    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    [$kumasiUser, $lagosUser, $globalUser] = makeTrioForPermission($kumasi, $lagos, 'transactions.resolve');
    Permission::findOrCreate('transactions.view_all');

    $transaction = PaymentTransaction::factory()->create([
        'branch_id' => $lagos->id,
    ]);

    $job = new SendUnderReviewNotificationJob($transaction);
    $job->handle(app(NotificationServiceInterface::class));

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});

/* ─── 4. Quote Confirmation ──────────────────────────────────────── */

it('quote confirmation does not notify users from other branches', function () {
    Mail::fake();

    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    Permission::findOrCreate('rentals.view_quotes');
    Permission::findOrCreate('rentals.view_all');

    $kumasiUser = User::factory()->create();
    $kumasiUser->givePermissionTo('rentals.view_quotes');
    $kumasiUser->branches()->attach($kumasi->id);

    $lagosUser = User::factory()->create();
    $lagosUser->givePermissionTo('rentals.view_quotes');
    $lagosUser->branches()->attach($lagos->id);

    $globalUser = User::factory()->create();
    $globalUser->givePermissionTo('rentals.view_all');
    /* No branch - global scope */

    $quoteRequest = QuoteRequest::factory()->create([
        'branch_id' => $lagos->id,
        'email' => 'requester@example.com',
    ]);

    /* Disable customer email so only in-app fires */
    $settings = app(NotificationSystemSettings::class);
    $settings->email_quote_confirmation = false;
    $settings->save();

    $job = new SendQuoteConfirmationJob($quoteRequest);
    $job->handle(app(NotificationServiceInterface::class), $settings);

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});

/* ─── 5. Vehicle Expiry ──────────────────────────────────────────── */

it('vehicle expiry does not notify users from other branches', function () {
    Mail::fake();

    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    [$kumasiUser, $lagosUser, $globalUser] = makeTrioForPermission($kumasi, $lagos, 'vehicles.view_all');
    Permission::findOrCreate('vehicles.manage_insurance');

    /* Enable system-wide toggle */
    $settings = app(NotificationSystemSettings::class);
    $settings->vehicle_expiry = true;
    $settings->save();

    /* Vehicle in Lagos with roadworthy expiring in 5 days (within 30-day window) */
    $vehicle = Vehicle::factory()->create([
        'branch_id' => $lagos->id,
        'roadworthy_expiry_date' => now()->addDays(5)->format('Y-m-d'),
        'insurance_expiry_date' => now()->addYear()->format('Y-m-d'),
    ]);

    $job = new SendVehicleExpiryNotificationJob($vehicle);
    $job->handle(app(NotificationServiceInterface::class));

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});

/* ─── 6. Driver Document Expiry ──────────────────────────────────── */

it('driver document expiry does not notify users from other branches', function () {
    Mail::fake();

    $kumasi = Branch::factory()->create(['name' => 'Kumasi']);
    $lagos = Branch::factory()->create(['name' => 'Lagos']);

    [$kumasiUser, $lagosUser, $globalUser] = makeTrioForPermission($kumasi, $lagos, 'drivers.view_all');

    /* Enable system-wide toggle */
    $settings = app(NotificationSystemSettings::class);
    $settings->driver_document_expiry = true;
    $settings->save();

    $creator = User::factory()->create();

    /* Driver with license expiring in 5 days (within 30-day window) */
    $driver = Driver::factory()->create([
        'created_by' => $creator->id,
        'is_active' => true,
        'license_expiry_date' => now()->addDays(5)->format('Y-m-d'),
    ]);

    /* branch_id is not in Driver fillable - set via DB directly */
    DB::table('drivers')->where('id', $driver->id)->update(['branch_id' => $lagos->id]);
    $driver->refresh();

    $job = new CheckDriverDocumentExpiryJob;
    $job->handle(
        app(NotificationServiceInterface::class),
        app(WhatsAppNotificationServiceInterface::class),
        app(SmsNotificationServiceInterface::class),
    );

    expect(notificationCount($kumasiUser))->toBe(0);
    expect(notificationCount($lagosUser))->toBeGreaterThanOrEqual(1);
    expect(notificationCount($globalUser))->toBeGreaterThanOrEqual(1);
});
