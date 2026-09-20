<?php

namespace Database\Seeders;

use App\Enums\PaymentTransactionStatus;
use App\Enums\TransactionType;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class UnderReviewTransactionSeeder extends Seeder
{
    /**
     * Seeds 3 under_review PaymentTransaction records across 3 different rentals.
     * Use these to test the resolve (approve/reject) UI in TransactionDetail.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('UnderReviewTransactionSeeder seeds development data and is skipped in production by default.');
            if (! confirm('UnderReviewTransactionSeeder - Run in production?', default: false)) {
                $this->command->warn('UnderReviewTransactionSeeder skipped.');

                return;
            }
        }

        $rentals = Rental::with('customer', 'vehicle.branch')
            ->whereIn('reference', ['RF-2026-00001', 'RF-2026-00002', 'RF-2026-00003'])
            ->get()
            ->keyBy('reference');

        if ($rentals->isEmpty()) {
            $this->command->warn('UnderReviewTransactionSeeder: no target rentals found - run RentalSeeder first.');

            return;
        }

        $cases = [
            [
                'reference_key' => 'RF-2026-00001',
                'ref_prefix' => 'REVIEW-A',
                'amount' => 900.00,
                'note' => 'Hubtel verify failed - IP not whitelisted, needs manual approval.',
            ],
            [
                'reference_key' => 'RF-2026-00002',
                'ref_prefix' => 'REVIEW-B',
                'amount' => 1250.50,
                'note' => 'Amount mismatch detected: customer paid 1250.50 but expected 1260.00.',
            ],
            [
                'reference_key' => 'RF-2026-00003',
                'ref_prefix' => 'REVIEW-C',
                'amount' => 680.00,
                'note' => 'Hubtel verify timeout - transaction unverified, pending admin review.',
            ],
        ];

        foreach ($cases as $case) {
            $rental = $rentals->get($case['reference_key']);

            if (! $rental) {
                continue;
            }

            $customer = $rental->customer;

            PaymentTransaction::create([
                'reference' => $case['ref_prefix'] . '-' . strtoupper(Str::random(6)),
                'provider' => 'hubtel',
                'provider_reference' => 'HBT-' . strtoupper(Str::random(10)),
                'channel' => 'momo',
                'payment_phone' => $customer?->phone ?? '0241234567',
                'amount' => $case['amount'],
                'currency' => 'GHS',
                'currency_symbol' => '₵',
                'exchange_rate' => 1.0,
                'status' => PaymentTransactionStatus::UnderReview->value,
                'type' => TransactionType::Payment->value,
                'description' => 'Online payment - under review',
                'payer_name' => $customer?->name ?? 'Unknown',
                'payer_email' => $customer?->email ?? '',
                'payer_phone' => $customer?->phone ?? '',
                'transactable_type' => 'rental',
                'transactable_id' => $rental->id,
                'branch_id' => $rental->vehicle?->branch_id ?? null,
                'metadata' => ['notes' => $case['note']],
                'processed_by_user_id' => null,
            ]);
        }

        $this->command->info('UnderReviewTransactionSeeder: seeded 3 under_review transactions.');
    }
}
