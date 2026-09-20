<?php

namespace App\Jobs;

use App\Mail\PaymentConfirmationMail;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
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

class SendPaymentConfirmationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly PaymentTransaction $transaction)
    {
        $this->onQueue('email');
    }

    /**
     * Send payment confirmation email to the customer, in-app notification to
     * admins/managers, plus WhatsApp and SMS alerts.
     */
    public function handle(
        NotificationServiceInterface $notificationService,
        WhatsAppNotificationServiceInterface $whatsAppService,
        SmsNotificationServiceInterface $smsService,
    ): void {
        $transaction = $this->transaction;
        $systemSettings = app(NotificationSystemSettings::class);

        /* Resolve the transactable model manually (no morphMap registered) */
        $transactable = match ($transaction->transactable_type) {
            'rental' => Rental::find($transaction->transactable_id),
            'airport_booking' => AirportBooking::find($transaction->transactable_id),
            'chauffeur_booking' => ChauffeurBooking::find($transaction->transactable_id),
            default => null,
        };

        [$permissions, $globalPermission] = match ($transaction->transactable_type) {
            'rental' => [['rentals.view_all', 'rentals.view_own'], 'rentals.view_all'],
            'airport_booking' => [['airport_transfer.view_all', 'airport_transfer.manage_bookings'], 'airport_transfer.view_all'],
            'chauffeur_booking' => [['chauffeur_rental.view_all', 'chauffeur_rental.manage_bookings'], 'chauffeur_rental.view_all'],
            default => [['rentals.view_all'], 'rentals.view_all'],
        };
        $ids = $this->resolveStaffIds($transaction->branch_id, $permissions, $globalPermission);

        /* In-app notification to admins and managers */
        if ($systemSettings->payment_confirmation ?? true) {
            $inappBranchMgrIds = ($systemSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
            $inappAdminIds = ($systemSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
            $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

            if (! empty($staffIds)) {
                $notificationService->send(
                    $staffIds,
                    'payment_confirmation',
                    'Payment Received',
                    "Payment of {$transaction->amount} {$transaction->currency} received for {$transaction->reference}.",
                    [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'action_url' => match ($transaction->transactable_type) {
                            'rental' => "/management/rentals/{$transaction->transactable_id}",
                            'airport_booking' => "/management/airport-transfer/bookings/{$transaction->transactable_id}",
                            'chauffeur_booking' => "/management/chauffeur-rental/bookings/{$transaction->transactable_id}",
                            default => null,
                        },
                    ],
                );
            }
        }

        /* Customer email - prefer payer_email from transaction, fall back to transactable */
        $customerEmail = $transaction->payer_email
            ?? ($transactable?->customer?->email ?? null)
            ?? ($transactable?->airportCustomer?->email ?? null)
            ?? ($transactable?->chauffeurCustomer?->email ?? null);

        if ($customerEmail && ($systemSettings->email_payment_confirmation ?? true)) {
            Mail::to($customerEmail)->queue(new PaymentConfirmationMail($transaction));
        }

        /* WhatsApp and SMS - only applicable to Rental transactables */
        if ($transactable instanceof Rental) {
            $whatsAppService->notifyPaymentConfirmation($transactable);
            $smsService->notifyPaymentConfirmation($transactable);
            $whatsAppService->notifyAdminPaymentConfirmation($transactable);
            $smsService->notifyAdminPaymentConfirmation($transactable);

            $branchMgrUsers = User::whereIn('id', $ids['branch_managers'])->whereNotNull('phone')->get();

            foreach ($branchMgrUsers as $mgr) {
                $whatsAppService->notifyAdminPaymentConfirmation($transactable, $mgr->phone);
                $smsService->notifyAdminPaymentConfirmation($transactable, $mgr->phone);
            }
        }
    }

    /**
     * @param  array<int, string>  $permissions
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

        /* view_all = cross-branch access. Only users with no branch assignment get global notifications. */
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
