<?php

namespace App\Jobs;

use App\Mail\RentalCancelledMail;
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

class SendRentalCancelledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Rental $rental)
    {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $rental = $this->rental->load(['customer', 'vehicle', 'manager', 'branch.managers']);

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($rental);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $inappStaffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($inappStaffIds)) {
            $notificationService->send(
                $inappStaffIds,
                'rental_cancelled',
                'Rental Cancelled',
                "Rental {$rental->reference} has been cancelled.",
                ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
            );
        }

        $systemSettings = app(NotificationSystemSettings::class);

        if ($rental->customer?->email && ($systemSettings->email_rental_cancelled ?? true)) {
            Mail::to($rental->customer->email)->queue(new RentalCancelledMail($rental));
        }

        $whatsAppService->notifyRentalCancelled($rental);
        $smsService->notifyRentalCancelled($rental);
        $whatsAppService->notifyAdminRentalCancelled($rental);
        $smsService->notifyAdminRentalCancelled($rental);
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

        /* Always include the directly assigned manager */
        if ($rental->manager_id && ! in_array($rental->manager_id, $branchManagerIds, true)) {
            $branchManagerIds[] = $rental->manager_id;
        }

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
