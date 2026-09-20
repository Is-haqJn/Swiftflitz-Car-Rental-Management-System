<?php

namespace App\Jobs;

use App\Enums\RentalStatus;
use App\Events\RentalOverdue;
use App\Models\Rental;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FlagOverdueRentals implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        $this->onQueue('high');
    }

    /**
     * Mark active rentals whose return date has passed as overdue and
     * dispatch an alert notification for each.
     */
    public function handle(): void
    {
        Rental::query()
            ->where('status', RentalStatus::Active->value)
            ->whereDate('return_date', '<', now()->toDateString())
            ->where('is_overdue', false)
            ->each(function (Rental $rental): void {
                $rental->update([
                    'status' => RentalStatus::Overdue->value,
                    'is_overdue' => true,
                ]);

                RentalOverdue::dispatch($rental);
            });
    }
}
