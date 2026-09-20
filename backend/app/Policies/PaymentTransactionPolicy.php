<?php

namespace App\Policies;

use App\Models\PaymentTransaction;
use App\Models\User;

class PaymentTransactionPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('transactions.view_all');
    }

    public function view(User $user, PaymentTransaction $transaction): bool
    {
        if (! $user->hasPermissionTo('transactions.view_all')) {
            return false;
        }

        if ($user->hasAnyRole(['super_admin', 'admin'])) {
            return true;
        }

        $userBranchIds = $user->branches()->pluck('id')->toArray();

        if (empty($userBranchIds)) {
            return false;
        }

        return in_array($transaction->branch_id, $userBranchIds, true);
    }

    public function export(User $user): bool
    {
        return $user->hasPermissionTo('transactions.export');
    }
}
