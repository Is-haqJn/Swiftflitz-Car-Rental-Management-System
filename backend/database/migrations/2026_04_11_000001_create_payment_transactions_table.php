<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->string('provider');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 5)->default('GHS');
            $table->string('status')->default('pending');
            $table->string('payer_email');
            $table->string('payer_phone');
            $table->string('payer_name');
            $table->string('transactable_id')->nullable();
            $table->string('transactable_type')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['transactable_type', 'transactable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
