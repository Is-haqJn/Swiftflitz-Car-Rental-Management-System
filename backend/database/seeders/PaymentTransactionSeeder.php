<?php

namespace Database\Seeders;

use App\Enums\TransactionType;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class PaymentTransactionSeeder extends Seeder
{
    /**
     * Create PaymentTransaction records for every seeded rental that has amount_paid > 0.
     * This ensures the dashboard revenue metrics (which now read from PaymentTransaction)
     * reflect the seeded data accurately.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('PaymentTransactionSeeder seeds development data and is skipped in production by default.');
            if (! confirm('PaymentTransactionSeeder - Run in production?', default: false)) {
                $this->command->warn('PaymentTransactionSeeder skipped.');

                return;
            }
        }

        $rentals = Rental::where('amount_paid', '>', 0)->get();

        foreach ($rentals as $rental) {
            $customer = $rental->customer;

            PaymentTransaction::create([
                'reference' => 'SEED-' . strtoupper(Str::random(8)),
                'provider' => 'manual',
                'channel' => 'cash',
                'type' => TransactionType::ManualPayment->value,
                'amount' => (float) $rental->amount_paid,
                'currency' => 'GHS',
                'status' => 'paid',
                'paid_at' => $rental->actual_return_date ?? $rental->updated_at ?? $rental->created_at,
                'description' => 'Seeded payment record',
                'payer_name' => $customer?->full_name ?? $customer?->name ?? 'Unknown',
                'payer_email' => $customer?->email ?? '',
                'payer_phone' => $customer?->phone ?? '',
                'transactable_type' => 'rental',
                'transactable_id' => $rental->id,
                'processed_by_user_id' => null,
            ]);
        }
    }
}
