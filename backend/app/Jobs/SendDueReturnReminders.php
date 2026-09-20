<?php

namespace App\Jobs;

use App\Enums\RentalStatus;
use App\Models\Rental;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendDueReturnReminders implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('high');
    }

    /**
     * Execute the job.
     *
     * Finds all active rentals due for return tomorrow and dispatches
     * a return reminder notification and email for each.
     */
    public function handle(): void
    {
        $tomorrow = now()->addDay()->startOfDay();

        $rentals = Rental::query()
            ->where('status', RentalStatus::Active->value)
            ->whereDate('return_date', $tomorrow)
            ->get();

        foreach ($rentals as $rental) {
            SendReturnReminderJob::dispatch($rental);
        }
    }
}
