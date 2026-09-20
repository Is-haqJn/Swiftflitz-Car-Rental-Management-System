<?php

namespace App\Jobs;

use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendUnderReviewNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly PaymentTransaction $transaction)
    {
        $this->onQueue('high');
    }

    /**
     * Notify admin users that a payment transaction requires manual review.
     * Recipients: users with transactions.resolve OR transactions.view_all permission,
     * plus super_admin and admin role holders as a fallback.
     */
    public function handle(NotificationServiceInterface $notificationService): void
    {
        $transaction = $this->transaction;

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds(
            $transaction->branch_id,
            ['transactions.resolve', 'transactions.view_all'],
            'transactions.resolve'
        );

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $userIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (empty($userIds)) {
            return;
        }

        $notificationService->send(
            $userIds,
            'payment_review',
            'Payment Requires Review',
            "Payment of {$transaction->amount} {$transaction->currency} requires manual review. Reference: {$transaction->reference}",
            [
                'transaction_id' => $transaction->id,
                'reference' => $transaction->reference,
                'action_url' => '/management/finance/transactions/' . $this->transaction->id,
            ],
        );
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
