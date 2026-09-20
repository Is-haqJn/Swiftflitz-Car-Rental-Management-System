<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('cancellation_amount_owed', 10, 2)->nullable()->after('refund_status');
            $table->boolean('cancellation_debt_waived')->default(false)->after('cancellation_amount_owed');
            $table->decimal('cancellation_deposit_deduction', 10, 2)->nullable()->after('cancellation_debt_waived');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'cancellation_amount_owed',
                'cancellation_debt_waived',
                'cancellation_deposit_deduction',
            ]);
        });
    }
};
