<?php

namespace App\Jobs;

use App\Mail\PickupReminderMail;
use App\Models\Rental;
use App\Models\User;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendPickupReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        $this->onQueue('email');
    }

    /**
     * Execute the job.
     * Notifies managers/admins of rentals with a pickup date scheduled for tomorrow.
     */
    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $tomorrow = now()->addDay()->format('Y-m-d');

        $rentals = Rental::with(['customer', 'manager', 'vehicle'])
            ->whereIn('status', ['confirmed', 'pending'])
            ->whereDate('pickup_date', $tomorrow)
            ->get();

        if ($rentals->isEmpty()) {
            return;
        }

        $notifSettings = app(NotificationSystemSettings::class);

        foreach ($rentals as $rental) {
            $customerName = $rental->customer?->name ?? 'Unknown Customer';
            $message = "Rental {$rental->reference} for {$customerName} is scheduled for pickup tomorrow ({$rental->pickup_date}).";

            $ids = $this->resolveStaffIds(
                $rental->branch_id,
                ['rentals.view_all', 'rentals.view_own'],
                'rentals.view_all'
            );

            $unconditional = $rental->manager_id ? [$rental->manager_id] : [];
            $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
            $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
            $recipientIds = array_unique([...$unconditional, ...$inappBranchMgrIds, ...$inappAdminIds]);

            if (! empty($recipientIds)) {
                $notificationService->send(
                    $recipientIds,
                    'pickup_reminder',
                    "Pickup Tomorrow: {$rental->reference}",
                    $message,
                    ['action_url' => "/management/rentals/{$rental->id}"]
                );
            }

            foreach ($recipientIds as $userId) {
                $user = User::find($userId);

                if (! $user || ! $user->email) {
                    continue;
                }

                if ($notificationService->shouldSendEmail($user, 'pickup_reminder')) {
                    Mail::to($user->email)->queue(new PickupReminderMail($rental));
                }
            }

            $whatsAppService->notifyPickupReminder($rental);
            $smsService->notifyPickupReminder($rental);
            $whatsAppService->notifyAdminPickupReminder($rental);
            $smsService->notifyAdminPickupReminder($rental);

            $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

            foreach ($branchMgrUsers as $mgr) {
                $whatsAppService->notifyAdminPickupReminder($rental, $mgr->phone);
                $smsService->notifyAdminPickupReminder($rental, $mgr->phone);
            }
        }
    }

    /**
     * @param  array<string>  $permissions
     * @return array{branch_managers: array<int>, admins: array<int>}
     */
    private function resolveStaffIds(?string $branchId, array $permissions, string $globalPermission): array
    {
        $branchManagerIds = $branchId
            ? User::where(function ($q) use ($permissions): void {
                $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $permissions))
                    ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $permissions)));
            })
                ->whereHas('branches', fn ($q) => $q->where('branches.id', $branchId))
                ->pluck('id')->toArray()
            : [];

        $adminIds = User::where(function ($q) use ($globalPermission): void {
            $q->whereHas('permissions', fn ($q) => $q->where('name', $globalPermission))
                ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->where('name', $globalPermission)));
        })
            ->whereDoesntHave('branches')
            ->pluck('id')->toArray();

        /* Dedupe: users in both groups go to branch_managers only */
        $adminIds = array_values(array_diff($adminIds, $branchManagerIds));

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
