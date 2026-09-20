<?php

namespace App\Jobs;

use App\Mail\OverdueAlertMail;
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

class SendOverdueAlertJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Rental $rental)
    {
        $this->onQueue('email');
    }

    /**
     * Send an overdue alert email and in-app notification for the given rental.
     */
    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $rental = $this->rental->load(['customer', 'vehicle', 'manager']);

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($rental);

        $unconditional = $rental->manager_id ? [$rental->manager_id] : [];
        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $staffIds = array_unique([...$unconditional, ...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($staffIds)) {
            $notificationService->send(
                $staffIds,
                'overdue_alert',
                'Rental Overdue',
                "Rental {$rental->reference} is overdue. Return date was {$rental->return_date->format('M d, Y')}.",
                ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
            );
        }

        if ($rental->customer?->email) {
            Mail::to($rental->customer->email)->queue(new OverdueAlertMail($rental));
        }

        $whatsAppService->notifyOverdueAlert($rental);
        $smsService->notifyOverdueAlert($rental);
        $whatsAppService->notifyAdminOverdueAlert($rental);
        $smsService->notifyAdminOverdueAlert($rental);

        $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

        foreach ($branchMgrUsers as $mgr) {
            $whatsAppService->notifyAdminOverdueAlert($rental, $mgr->phone);
            $smsService->notifyAdminOverdueAlert($rental, $mgr->phone);
        }
    }

    /**
     * @return array{branch_managers: array<int>, admins: array<int>}
     */
    private function resolveStaffIds(Rental $rental): array
    {
        $rentalPermissions = ['rentals.view_all', 'rentals.view_own'];

        $branchManagerIds = $rental->branch_id
            ? User::where(function ($q) use ($rentalPermissions): void {
                $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $rentalPermissions))
                    ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $rentalPermissions)));
            })
                ->whereHas('branches', fn ($q) => $q->where('branches.id', $rental->branch_id))
                ->pluck('id')->toArray()
            : [];

        $adminIds = User::where(function ($q): void {
            $q->whereHas('permissions', fn ($q) => $q->where('name', 'rentals.view_all'))
                ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->where('name', 'rentals.view_all')));
        })
            ->whereDoesntHave('branches')
            ->pluck('id')->toArray();

        /* Dedupe: users in both groups go to branch_managers only */
        $adminIds = array_values(array_diff($adminIds, $branchManagerIds));

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
