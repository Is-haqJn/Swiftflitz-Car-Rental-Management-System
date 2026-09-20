<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add FK on coupon_usages.rental_id → rentals.id
        Schema::table('coupon_usages', function (Blueprint $table) {
            $table->foreign('rental_id')
                ->references('id')
                ->on('rentals')
                ->nullOnDelete();
        });

        // Add FK on rental_discount_usages.rental_id → rentals.id
        Schema::table('rental_discount_usages', function (Blueprint $table) {
            $table->foreign('rental_id')
                ->references('id')
                ->on('rentals')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('coupon_usages', function (Blueprint $table) {
            $table->dropForeign(['rental_id']);
        });

        Schema::table('rental_discount_usages', function (Blueprint $table) {
            $table->dropForeign(['rental_id']);
        });
    }
};
