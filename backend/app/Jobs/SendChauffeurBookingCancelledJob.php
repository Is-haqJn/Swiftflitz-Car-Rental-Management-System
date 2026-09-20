<?php

namespace App\Jobs;

use App\Mail\ChauffeurBookingCancelledMail;
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
use Illuminate\Support\Facades\Mail;

class SendChauffeurBookingCancelledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly ChauffeurBooking $booking)
    {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $booking = $this->booking->load(['chauffeurCustomer', 'branch.managers']);

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($booking);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($staffIds)) {
            $notificationService->send(
                $staffIds,
                'chauffeur_booking_cancelled',
                'Chauffeur Booking Cancelled',
                "Chauffeur booking {$booking->booking_reference} has been cancelled.",
                ['booking_id' => $booking->id, 'reference' => $booking->booking_reference, 'action_url' => "/management/chauffeur-rental/bookings/{$booking->id}"],
            );
        }

        $systemSettings = app(NotificationSystemSettings::class);

        $customerEmail = $booking->chauffeurCustomer?->email ?? null;

        if ($customerEmail && ($systemSettings->email_chauffeur_booking_cancelled ?? true)) {
            Mail::to($customerEmail)->queue(new ChauffeurBookingCancelledMail($booking));
        }

        $whatsAppService->notifyChauffeurBookingCancelled($booking);
        $smsService->notifyChauffeurBookingCancelled($booking);
        $whatsAppService->notifyAdminChauffeurBookingCancelled($booking);
        $smsService->notifyAdminChauffeurBookingCancelled($booking);

        $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

        foreach ($branchMgrUsers as $mgr) {
            $whatsAppService->notifyAdminChauffeurBookingCancelled($booking, $mgr->phone);
            $smsService->notifyAdminChauffeurBookingCancelled($booking, $mgr->phone);
        }
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
