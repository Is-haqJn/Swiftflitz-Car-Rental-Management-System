<?php

namespace App\Jobs;

use App\Mail\NewQuoteRequestMail;
use App\Mail\QuoteConfirmationMail;
use App\Models\QuoteRequest;
use App\Models\User;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendQuoteConfirmationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly QuoteRequest $quoteRequest)
    {
        $this->onQueue('email');
    }

    /**
     * Send a quote confirmation email to the requester and notify admins/managers
     * via in-app notification and email.
     */
    public function handle(NotificationServiceInterface $notificationService, NotificationSystemSettings $systemSettings): void
    {
        $quoteRequest = $this->quoteRequest->load(['vehicle']);

        /* Send confirmation email to the customer only when the system-wide toggle is enabled */
        if ($quoteRequest->email && $systemSettings->email_quote_confirmation) {
            Mail::to($quoteRequest->email)->queue(new QuoteConfirmationMail($quoteRequest));
        }

        /* Notify branch-scoped staff with quote-view permissions in-app about the new quote request */
        $ids = $this->resolveStaffIds(
            $quoteRequest->branch_id,
            ['rentals.view_quotes', 'rentals.view_all'],
            'rentals.view_all'
        );

        $inappBranchMgrIds = ($systemSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($systemSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $staffIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);
        $admins = User::findMany($staffIds);

        if ($admins->isNotEmpty()) {
            $vehicleName = $quoteRequest->vehicle?->name ?? 'a vehicle';
            $notificationService->send(
                $admins->pluck('id')->all(),
                'new_quote_request',
                'New Quote Request',
                "Quote request {$quoteRequest->reference} submitted by {$quoteRequest->name} for {$vehicleName}.",
                [
                    'quote_request_id' => $quoteRequest->id,
                    'reference' => $quoteRequest->reference,
                ],
            );

            // ? Send email to each admin/manager who has quote_request emails enabled
            foreach ($admins as $admin) {
                if ($admin->email && $notificationService->shouldSendEmail($admin, 'new_quote_request')) {
                    Mail::to($admin->email)->queue(new NewQuoteRequestMail($quoteRequest, $admin));
                }
            }
        }
    }

    /**
     * @param  array<string>  $permissions
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
