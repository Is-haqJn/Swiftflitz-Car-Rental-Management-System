<?php

namespace App\Jobs;

use App\Mail\RentalStatusChangedMail;
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

class SendRentalStatusChangedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly Rental $rental,
        public readonly string $oldStatus,
    ) {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $rental = $this->rental->load(['customer', 'vehicle', 'manager', 'branch.managers']);

        $newStatusLabel = ucfirst(str_replace('_', ' ', $rental->status->value ?? $rental->status));

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($rental);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $inappStaffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($inappStaffIds)) {
            $notificationService->send(
                $inappStaffIds,
                'rental_status_change',
                'Rental Status Updated',
                "Booking {$rental->reference} status changed to {$newStatusLabel}.",
                [
                    'rental_id' => $rental->id,
                    'reference' => $rental->reference,
                    'old_status' => $this->oldStatus,
                    'new_status' => $rental->status->value ?? $rental->status,
                    'action_url' => "/management/rentals/{$rental->id}",
                ],
            );
        }

        $systemSettings = app(NotificationSystemSettings::class);

        if ($rental->customer?->email && ($systemSettings->email_rental_status_change ?? true)) {
            Mail::to($rental->customer->email)->queue(
                new RentalStatusChangedMail($rental, $this->oldStatus, $rental->status->value ?? $rental->status)
            );
        }

        $whatsAppService->notifyRentalStatusChanged($rental, $this->oldStatus);
        $smsService->notifyRentalStatusChanged($rental, $this->oldStatus);
        $whatsAppService->notifyAdminRentalStatusChanged($rental, $this->oldStatus);
        $smsService->notifyAdminRentalStatusChanged($rental, $this->oldStatus);
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
