<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            /*
             * channel: payment channel used (e.g. momo, card, cash, bank_transfer, online)
             * payment_phone: phone number used for mobile money or card payments
             */
            $table->string('channel')->nullable()->after('provider');
            $table->string('payment_phone')->nullable()->after('channel');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropColumn(['channel', 'payment_phone']);
        });
    }
};
