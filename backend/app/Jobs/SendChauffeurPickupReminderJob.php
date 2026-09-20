<?php

namespace App\Jobs;

use App\Mail\ChauffeurPickupReminderMail;
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

class SendChauffeurPickupReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $tomorrow = now()->addDay()->format('Y-m-d');

        $bookings = ChauffeurBooking::with(['chauffeurCustomer', 'vehicle', 'branch.managers'])
            ->whereIn('booking_status', ['confirmed', 'driver_assigned'])
            ->whereDate('pickup_time', $tomorrow)
            ->get();

        if ($bookings->isEmpty()) {
            return;
        }

        $notifSettings = app(NotificationSystemSettings::class);

        foreach ($bookings as $booking) {
            $ids = $this->resolveStaffIds($booking);

            $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
            $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
            $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

            if (! empty($staffIds)) {
                $notificationService->send(
                    $staffIds,
                    'chauffeur_pickup_reminder',
                    "Pickup Tomorrow: {$booking->booking_reference}",
                    "Chauffeur booking {$booking->booking_reference} has a pickup scheduled for tomorrow.",
                    ['booking_id' => $booking->id, 'reference' => $booking->booking_reference, 'action_url' => "/management/chauffeur-rental/bookings/{$booking->id}"],
                );

                foreach (User::findMany($staffIds) as $staff) {
                    if ($staff->email && $notificationService->shouldSendEmail($staff, 'chauffeur_pickup_reminder')) {
                        Mail::to($staff->email)->queue(new ChauffeurPickupReminderMail($booking, $staff));
                    }
                }
            }

            $whatsAppService->notifyChauffeurPickupReminder($booking);
            $smsService->notifyChauffeurPickupReminder($booking);
            $whatsAppService->notifyAdminChauffeurPickupReminder($booking);
            $smsService->notifyAdminChauffeurPickupReminder($booking);

            $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

            foreach ($branchMgrUsers as $mgr) {
                $whatsAppService->notifyAdminChauffeurPickupReminder($booking, $mgr->phone);
                $smsService->notifyAdminChauffeurPickupReminder($booking, $mgr->phone);
            }
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
