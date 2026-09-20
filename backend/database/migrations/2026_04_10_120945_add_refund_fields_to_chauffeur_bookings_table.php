<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->text('refund_note')->nullable()->after('cancellation_fee_applied');
        });
    }

    public function down(): void
    {
        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->dropColumn('refund_note');
        });
    }
};
