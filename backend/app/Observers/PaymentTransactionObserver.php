<?php

namespace App\Observers;

use App\Models\PaymentTransaction;
use InvalidArgumentException;

class PaymentTransactionObserver
{
    /**
     * Handle the PaymentTransaction "creating" event.
     */
    public function creating(PaymentTransaction $transaction): void
    {
        if ($transaction->amount !== null && $transaction->amount < 0) {
            throw new InvalidArgumentException('PaymentTransaction amount must be >= 0.');
        }
    }

    /**
     * Handle the PaymentTransaction "updating" event.
     */
    public function updating(PaymentTransaction $transaction): void
    {
        if ($transaction->isDirty('amount') && $transaction->amount !== null && $transaction->amount < 0) {
            throw new InvalidArgumentException('PaymentTransaction amount must be >= 0.');
        }
    }
}
