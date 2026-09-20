<?php

namespace App\Jobs;

use App\Enums\RentalPaymentStatus;
use App\Enums\RentalSource;
use App\Mail\BookingConfirmationMail;
use App\Mail\NewBookingAdminMail;
use App\Models\Rental;
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

class SendBookingConfirmationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Rental $rental)
    {
        $this->onQueue('email');
    }

    /**
     * Send a booking confirmation email to the customer, in-app notification to
     * admins/managers, and a new-booking email to each admin/manager who has
     * the email_new_booking setting enabled.
     */
    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $rental = $this->rental->load(['customer', 'vehicle', 'manager']);

        $notifSettings = app(NotificationSystemSettings::class);
        $emailSettings = app(EmailSettings::class);
        $ids = $this->resolveStaffIds($rental);

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $inappStaffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (! empty($inappStaffIds)) {
            $notificationService->send(
                $inappStaffIds,
                'booking_created',
                'New Booking Created',
                "Booking {$rental->reference} has been created for {$rental->customer->name}.",
                ['rental_id' => $rental->id, 'reference' => $rental->reference, 'action_url' => "/management/rentals/{$rental->id}"],
            );
        }

        $emailBranchMgrIds = ($emailSettings->notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $emailAdminIds = ($emailSettings->notify_admins ?? true) ? $ids['admins'] : [];
        $emailStaffIds = array_unique([...$emailBranchMgrIds, ...$emailAdminIds]);
        $admins = User::whereIn('id', $emailStaffIds)->get();

        foreach ($admins as $admin) {
            if ($admin->email && $notificationService->shouldSendEmail($admin, 'booking_created')) {
                Mail::to($admin->email)->queue(new NewBookingAdminMail($rental, $admin));
            }
        }

        $systemSettings = app(NotificationSystemSettings::class);

        $paymentUrl = null;
        $amountDue = null;

        $needsPaymentLink = $rental->source === RentalSource::Website
            && in_array($rental->payment_status, [
                RentalPaymentStatus::Pending,
                RentalPaymentStatus::PartiallyPaid,
            ], true);

        if ($needsPaymentLink) {
            $customer = $rental->customer;
            $queryParams = http_build_query(array_filter([
                'name' => $customer?->name,
                'email' => $customer?->email,
                'phone' => $customer?->phone,
                'booking_ref' => $rental->reference,
            ]));
            $paymentUrl = rtrim(config('app.frontend_url'), '/')
                . '/payment/rental/' . $rental->id
                . '?' . $queryParams;
            $amountDue = max(0.0, (float) $rental->total_cost - (float) $rental->amount_paid);
        }

        if ($rental->customer->email && ($systemSettings->email_new_booking ?? true)) {
            Mail::to($rental->customer->email)->queue(
                new BookingConfirmationMail($rental, $paymentUrl, $amountDue)
            );
        }

        $whatsAppService->notifyNewBooking($rental);
        $whatsAppService->notifyAdminNewBooking($rental);
        $smsService->notifyNewBooking($rental);
        $smsService->notifyAdminNewBooking($rental);

        $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

        foreach ($branchMgrUsers as $mgr) {
            $whatsAppService->notifyAdminNewBooking($rental, $mgr->phone);
            $smsService->notifyAdminNewBooking($rental, $mgr->phone);
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

        /* Always include the directly assigned manager */
        if ($rental->manager_id && ! in_array($rental->manager_id, $branchManagerIds, true)) {
            $branchManagerIds[] = $rental->manager_id;
        }

        return ['branch_managers' => $branchManagerIds, 'admins' => $adminIds];
    }
}
