<?php

namespace App\Jobs;

use App\Mail\ChauffeurBookingConfirmationMail;
use App\Mail\NewChauffeurBookingAdminMail;
use App\Models\ChauffeurBooking;
use App\Models\User;
use App\Services\Contracts\Notifications\SmsNotificationServiceInterface;
use App\Services\Contracts\Notifications\WhatsAppNotificationServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\EmailSettings;
use App\Settings\NotificationSystemSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendChauffeurBookingConfirmationJob implements ShouldQueue
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
        $booking = $this->booking->load(['chauffeurCustomer', 'vehicle', 'branch.managers']);

        $notifSettings = app(NotificationSystemSettings::class);
        $emailSettings = app(EmailSettings::class);
        $ids = $this->resolveStaffIds($booking);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $inappStaffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($inappStaffIds)) {
            $notificationService->send(
                $inappStaffIds,
                'chauffeur_booking',
                'New Chauffeur Booking',
                "New chauffeur booking {$booking->booking_reference} has been created.",
                ['booking_id' => $booking->id, 'reference' => $booking->booking_reference, 'action_url' => "/management/chauffeur-rental/bookings/{$booking->id}"],
            );
        }

        $emailBranchMgrIds = ($emailSettings->notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $emailAdminIds = ($emailSettings->notify_admins ?? true) ? $ids['admins'] : [];
        $emailStaffIds = array_unique([...$emailBranchMgrIds, ...$emailAdminIds]);

        if (! empty($emailStaffIds) && ($notifSettings->email_chauffeur_booking ?? true)) {
            foreach (User::findMany($emailStaffIds) as $staff) {
                if ($staff->email && $notificationService->shouldSendEmail($staff, 'chauffeur_booking')) {
                    Mail::to($staff->email)->queue(new NewChauffeurBookingAdminMail($booking, $staff));
                }
            }
        }

        $customerEmail = $booking->chauffeurCustomer?->email ?? null;

        if ($customerEmail && ($notifSettings->email_chauffeur_booking ?? true)) {
            Mail::to($customerEmail)->queue(new ChauffeurBookingConfirmationMail($booking));
        }

        $whatsAppService->notifyChauffeurBooking($booking);
        $smsService->notifyChauffeurBooking($booking);
        $whatsAppService->notifyAdminChauffeurBooking($booking);
        $smsService->notifyAdminChauffeurBooking($booking);

        $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

        foreach ($branchMgrUsers as $mgr) {
            $whatsAppService->notifyAdminChauffeurBooking($booking, $mgr->phone);
            $smsService->notifyAdminChauffeurBooking($booking, $mgr->phone);
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
