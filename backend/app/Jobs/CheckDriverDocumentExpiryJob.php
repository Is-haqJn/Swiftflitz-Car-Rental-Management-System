<?php

namespace App\Jobs;

use App\Mail\DriverDocumentExpiryMail;
use App\Models\Driver;
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

class CheckDriverDocumentExpiryJob implements ShouldQueue
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
        $threshold = now()->addDays(30);

        $expiringDrivers = Driver::where('is_active', true)
            ->where(function ($query) use ($threshold): void {
                $query->where('license_expiry_date', '<=', $threshold)
                    ->orWhere('id_expiry_date', '<=', $threshold);
            })
            ->get();

        if ($expiringDrivers->isEmpty()) {
            return;
        }

        $notifSettings = app(NotificationSystemSettings::class);

        foreach ($expiringDrivers as $driver) {
            $expiringDocuments = [];

            if ($driver->license_expiry_date && $driver->license_expiry_date->lte($threshold)) {
                $expiringDocuments[] = "driver's license";
            }

            if ($driver->id_expiry_date && $driver->id_expiry_date->lte($threshold)) {
                $expiringDocuments[] = 'national ID';
            }

            $ids = $this->resolveStaffIds(
                $driver->branch_id,
                ['drivers.view_all'],
                'drivers.view_all'
            );

            $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
            $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
            $recipientIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);
            $staffUsers = User::findMany($recipientIds);

            foreach ($expiringDocuments as $documentType) {
                if (! empty($recipientIds)) {
                    $notificationService->send(
                        $recipientIds,
                        'driver_document_expiry',
                        'Driver Document Expiry Alert',
                        "Driver {$driver->full_name}'s {$documentType} is expiring soon.",
                        ['driver_id' => $driver->id],
                    );
                }

                foreach ($staffUsers as $staff) {
                    if ($staff->email && $notificationService->shouldSendEmail($staff, 'driver_document_expiry')) {
                        Mail::to($staff->email)->queue(new DriverDocumentExpiryMail($driver, $documentType, $staff));
                    }
                }

                $whatsAppService->notifyDriverDocumentExpiry($driver, $documentType);
                $smsService->notifyDriverDocumentExpiry($driver, $documentType);
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
