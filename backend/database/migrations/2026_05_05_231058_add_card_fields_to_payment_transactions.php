<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            $table->string('card_bin', 6)->nullable()->after('payment_phone');
            $table->string('card_last4', 4)->nullable()->after('card_bin');
            $table->string('card_type', 30)->nullable()->after('card_last4');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            $table->dropColumn(['card_bin', 'card_last4', 'card_type']);
        });
    }
};
