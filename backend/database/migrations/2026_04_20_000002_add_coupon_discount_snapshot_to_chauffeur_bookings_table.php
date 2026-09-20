<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->decimal('coupon_discount_snapshot', 10, 2)->default(0.00)->after('vat_amount');
        });
    }

    public function down(): void
    {
        Schema::table('chauffeur_bookings', function (Blueprint $table) {
            $table->dropColumn('coupon_discount_snapshot');
        });
    }
};
