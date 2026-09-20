<?php

namespace App\Jobs;

use App\Mail\AirportBookingCancelledMail;
use App\Models\AirportBooking;
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

class SendAirportBookingCancelledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly AirportBooking $booking)
    {
        $this->onQueue('email');
    }

    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $booking = $this->booking->load(['airportCustomer', 'branch.managers']);

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds($booking);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($staffIds)) {
            $notificationService->send(
                $staffIds,
                'airport_booking_cancelled',
                'Airport Booking Cancelled',
                "Airport booking {$booking->booking_reference} has been cancelled.",
                ['booking_id' => $booking->id, 'reference' => $booking->booking_reference, 'action_url' => "/management/airport-transfer/bookings/{$booking->id}"],
            );
        }

        $customerEmail = $booking->airportCustomer?->email ?? $booking->passenger_email ?? null;

        if ($customerEmail && ($notifSettings->email_airport_booking_cancelled ?? true)) {
            Mail::to($customerEmail)->queue(new AirportBookingCancelledMail($booking));
        }

        $whatsAppService->notifyAirportBookingCancelled($booking);
        $smsService->notifyAirportBookingCancelled($booking);
        $whatsAppService->notifyAdminAirportBookingCancelled($booking);
        $smsService->notifyAdminAirportBookingCancelled($booking);

        $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

        foreach ($branchMgrUsers as $mgr) {
            $whatsAppService->notifyAdminAirportBookingCancelled($booking, $mgr->phone);
            $smsService->notifyAdminAirportBookingCancelled($booking, $mgr->phone);
        }
    }

    /**
     * @return array{branch_managers: array<int>, admins: array<int>}
     */
    private function resolveStaffIds(AirportBooking $booking): array
    {
        $airportPermissions = ['airport_transfer.view_all', 'airport_transfer.manage_bookings'];

        $branchManagerIds = $booking->branch_id
            ? User::where(function ($q) use ($airportPermissions): void {
                $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $airportPermissions))
                    ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $airportPermissions)));
            })
                ->whereHas('branches', fn ($q) => $q->where('branches.id', $booking->branch_id))
                ->pluck('id')->toArray()
            : [];

        $adminIds = User::where(function ($q): void {
            $q->whereHas('permissions', fn ($q) => $q->where('name', 'airport_transfer.view_all'))
                ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->where('name', 'airport_transfer.view_all')));
        })
            ->whereDoesntHave('branches')
            ->pluck('id')->toArray();

        /* Dedupe: users in both groups go to branch_managers only */
        $adminIds = array_values(array_diff($adminIds, $branchManagerIds));

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
