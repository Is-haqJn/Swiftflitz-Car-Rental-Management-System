<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->char('branch_id', 36)->nullable()->after('transactable_id')->index();
        });

        /* Backfill branch_id from the polymorphic target */
        DB::table('payment_transactions')
            ->whereNotNull('transactable_type')
            ->whereNotNull('transactable_id')
            ->orderBy('id')
            ->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    $branchId = match ($row->transactable_type) {
                        'rental' => DB::table('rentals')->where('id', $row->transactable_id)->value('branch_id'),
                        'airport_booking' => DB::table('airport_bookings')->where('id', $row->transactable_id)->value('branch_id'),
                        'chauffeur_booking' => DB::table('chauffeur_bookings')->where('id', $row->transactable_id)->value('branch_id'),
                        default => null,
                    };

                    if ($branchId) {
                        DB::table('payment_transactions')
                            ->where('id', $row->id)
                            ->update(['branch_id' => $branchId]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropColumn('branch_id');
        });
    }
};
