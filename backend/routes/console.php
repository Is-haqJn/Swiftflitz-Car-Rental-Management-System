<?php

use App\Jobs\CalculateDailyReportStatsJob;
use App\Jobs\CalculateDashboardStatsJob;
use App\Jobs\CalculateMonthlyReportStatsJob;
use App\Jobs\CalculateYearlyReportStatsJob;
use App\Jobs\CheckDriverDocumentExpiryJob;
use App\Jobs\CheckPendingHubtelPaymentsJob;
use App\Jobs\CheckVehicleExpiryJob;
use App\Jobs\DeleteExpiredRentalVideosJob;
use App\Jobs\FlagOverdueRentals;
use App\Jobs\PerformSystemMaintenance;
use App\Jobs\QueueHeartbeatJob;
use App\Jobs\RecalculateRevenueSnapshotsJob;
use App\Jobs\SendChauffeurPickupReminderJob;
use App\Jobs\SendDueReturnReminders;
use App\Jobs\SendPickupReminderJob;
use App\Settings\BackupSettings;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/* Heartbeat job - updates cache key every 5 minutes so dashboard can detect worker status */
Schedule::job(QueueHeartbeatJob::class)->everyFiveMinutes();

// Schedule::command('telescope:prune')->daily();

Schedule::command('telescope:prune --hours=48')->daily();

Schedule::job(FlagOverdueRentals::class)->dailyAt('00:05');
// Schedule::job(FlagOverdueRentals::class)->everyThirtyMinutes();

// ? Send return reminders for rentals due tomorrow (runs every morning at 08:00)
Schedule::job(SendDueReturnReminders::class)->dailyAt('08:00');
// Schedule::job(SendDueReturnReminders::class)->everyThirtyMinutes();

// ? Clean up expired export records and files every night
Schedule::job(PerformSystemMaintenance::class)->dailyAt('02:00');
// Schedule::job(PerformSystemMaintenance::class)->everyThirtyMinutes();

/* Daily database backup at 3am (gated by BackupSettings toggle) */
Schedule::command('db:backup')
    ->dailyAt('03:00')
    ->when(fn () => app(BackupSettings::class)->scheduled_db_backup_enabled);

/* Weekly full system backup every Sunday at 04:00 (gated by BackupSettings toggle) */
Schedule::command('system:backup')
    ->weeklyOn(0, '04:00')
    ->when(fn () => app(BackupSettings::class)->scheduled_system_backup_enabled);

// ? Check vehicle roadworthy and insurance expiry every morning at 09:00
Schedule::job(CheckVehicleExpiryJob::class)->dailyAt('09:00');
// Schedule::job(CheckVehicleExpiryJob::class)->everyThirtyMinutes();

// ? Send pickup reminders for rentals scheduled for tomorrow (runs every morning at 07:00)
Schedule::job(SendPickupReminderJob::class)->dailyAt('07:00');
// Schedule::job(SendPickupReminderJob::class)->everyThirtyMinutes();

// ? Send pickup reminders for chauffeur bookings scheduled for tomorrow (runs every morning at 07:00)
Schedule::job(SendChauffeurPickupReminderJob::class)->dailyAt('07:00');
// Schedule::job(SendChauffeurPickupReminderJob::class)->everyThirtyMinutes();

// ? Check driver license and ID document expiry every morning at 09:15
Schedule::job(CheckDriverDocumentExpiryJob::class)->dailyAt('09:15');
// Schedule::job(CheckDriverDocumentExpiryJob::class)->everyThirtyMinutes();

/*
 * Hubtel mandatory: re-verify any pending Hubtel transactions that have not
 * received a webhook callback within 5 minutes of initiation.
 */
Schedule::job(CheckPendingHubtelPaymentsJob::class)->everyFiveMinutes(); // TODO: Enable once we have pending transactions to check against

/* Pre-warm daily report stats cache every night at 01:00 */
Schedule::job(CalculateDailyReportStatsJob::class)->dailyAt('01:00');

/* Pre-warm monthly report stats cache on the 1st of each month at 01:30 */
Schedule::job(CalculateMonthlyReportStatsJob::class)->monthlyOn(1, '01:30');

/* Pre-warm yearly report stats cache on Jan 1st at 02:30 */
Schedule::job(CalculateYearlyReportStatsJob::class)->yearlyOn(1, 1, '02:30');

/* Pre-warm dashboard stats for all admin/manager users every hour */
Schedule::job(CalculateDashboardStatsJob::class)->hourly();

/* Recalculate revenue snapshots table every 30 minutes for fast trend chart loads */
Schedule::job(RecalculateRevenueSnapshotsJob::class)->everyThirtyMinutes();

/* Delete video files for rentals completed more than 30 days ago (tombstone: keeps Media record + thumb) */
Schedule::job(new DeleteExpiredRentalVideosJob)->dailyAt('02:00')->name('rental-videos-cleanup')->onOneServer();
