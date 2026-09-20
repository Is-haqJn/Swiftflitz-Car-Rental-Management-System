<?php

namespace App\Jobs;

use App\Enums\VehicleStatus;
use App\Models\Vehicle;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckVehicleExpiryJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('high');
    }

    /**
     * Check all non-retired vehicles for upcoming roadworthy or insurance
     * expiry (within 30 days) and dispatch a notification job for each match.
     */
    public function handle(): void
    {
        $today = now()->startOfDay();
        $threshold = now()->addDays(30)->endOfDay();

        Vehicle::query()
            ->where('status', '!=', VehicleStatus::Retired->value)
            ->where(function ($query) use ($today, $threshold): void {
                $query->whereBetween('roadworthy_expiry_date', [$today, $threshold])
                    ->orWhereBetween('insurance_expiry_date', [$today, $threshold]);
            })
            ->each(function (Vehicle $vehicle): void {
                SendVehicleExpiryNotificationJob::dispatch($vehicle);
            });
    }
}
