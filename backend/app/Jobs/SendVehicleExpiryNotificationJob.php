<?php

namespace App\Jobs;

use App\Mail\VehicleExpiryMail;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\Contracts\NotificationServiceInterface;
use App\Settings\NotificationSystemSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendVehicleExpiryNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Vehicle $vehicle)
    {
        $this->onQueue('email');
    }

    /**
     * Notify all admins and managers about an upcoming vehicle roadworthy
     * or insurance document expiry.
     */
    public function handle(NotificationServiceInterface $notificationService): void
    {
        $vehicle = $this->vehicle;
        $today = now()->startOfDay();

        $lines = [];

        if ($vehicle->roadworthy_expiry_date) {
            $days = (int) $today->diffInDays($vehicle->roadworthy_expiry_date, false);
            if ($days >= 0 && $days <= 30) {
                $lines[] = $days === 0
                    ? 'Roadworthy certificate expires today'
                    : "Roadworthy certificate expires in {$days} day" . ($days !== 1 ? 's' : '');
            }
        }

        if ($vehicle->insurance_expiry_date) {
            $days = (int) $today->diffInDays($vehicle->insurance_expiry_date, false);
            if ($days >= 0 && $days <= 30) {
                $lines[] = $days === 0
                    ? 'Insurance expires today'
                    : "Insurance expires in {$days} day" . ($days !== 1 ? 's' : '');
            }
        }

        if (empty($lines)) {
            return;
        }

        $message = implode('. ', $lines) . '.';

        $notifSettings = app(NotificationSystemSettings::class);
        $ids = $this->resolveStaffIds(
            $vehicle->branch_id,
            ['vehicles.view_all', 'vehicles.manage_insurance'],
            'vehicles.view_all'
        );

        $inappBranchMgrIds = ($notifSettings->inapp_notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
        $inappAdminIds = ($notifSettings->inapp_notify_admins ?? true) ? $ids['admins'] : [];
        $userIds = array_unique([...$inappBranchMgrIds, ...$inappAdminIds]);

        if (empty($userIds)) {
            return;
        }

        $notificationService->send(
            $userIds,
            'vehicle_expiry',
            "Document Expiry - {$vehicle->name} - {$vehicle->license_plate} ({$vehicle->make} {$vehicle->model})",
            $message,
            ['vehicle_id' => $vehicle->id, 'license_plate' => $vehicle->license_plate],
        );

        foreach ($userIds as $userId) {
            $user = User::find($userId);

            if (! $user || ! $user->email) {
                continue;
            }

            if ($notificationService->shouldSendEmail($user, 'vehicle_expiry')) {
                Mail::to($user->email)->queue(new VehicleExpiryMail($vehicle, $message));
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
