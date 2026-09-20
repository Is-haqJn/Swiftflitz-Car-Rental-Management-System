<?php

namespace App\Jobs;

use App\Models\ChauffeurBooking;
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

class SendChauffeurBookingStatusChangedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly ChauffeurBooking $booking,
        public readonly string $oldStatus,
    ) {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $booking = $this->booking->load(['branch.managers']);

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($booking);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($staffIds)) {
            $newStatus = ucfirst(strtolower(str_replace('_', ' ', $booking->booking_status->value)));

            $notificationService->send(
                $staffIds,
                'chauffeur_booking_status_changed',
                'Chauffeur Booking Status Updated',
                "Chauffeur booking {$booking->booking_reference} status changed to {$newStatus}.",
                ['booking_id' => $booking->id, 'reference' => $booking->booking_reference, 'action_url' => "/management/chauffeur-rental/bookings/{$booking->id}"],
            );
        }

        $whatsAppService->notifyChauffeurBookingStatusChanged($booking, $this->oldStatus);
        $smsService->notifyChauffeurBookingStatusChanged($booking, $this->oldStatus);
    }

    /**
     * @return array{branch_managers: array<int>, admins: array<int>}
     */
    private function resolveStaffIds(ChauffeurBooking $booking): array
    {
        $chauffeurPermissions = ['chauffeur_rental.view_all', 'chauffeur_rental.manage_bookings'];

        $branchManagerIds = $booking->branch_id
            ? User::where(function ($q) use ($chauffeurPermissions): void {
                $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $chauffeurPermissions))
                    ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $chauffeurPermissions)));
            })
                ->whereHas('branches', fn ($q) => $q->where('branches.id', $booking->branch_id))
                ->pluck('id')->toArray()
            : [];

        $adminIds = User::where(function ($q): void {
            $q->whereHas('permissions', fn ($q) => $q->where('name', 'chauffeur_rental.view_all'))
                ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->where('name', 'chauffeur_rental.view_all')));
        })
            ->whereDoesntHave('branches')
            ->pluck('id')->toArray();

        /* Dedupe: users in both groups go to branch_managers only */
        $adminIds = array_values(array_diff($adminIds, $branchManagerIds));

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
