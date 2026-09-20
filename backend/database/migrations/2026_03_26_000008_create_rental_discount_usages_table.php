<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_discount_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // No FK constraint yet - rentals table doesn't exist in this phase
            $table->uuid('rental_id');
            $table->foreignUuid('discount_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('applied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('discount_type', ['rule', 'manual'])->default('rule');
            $table->decimal('amount', 10, 2);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_discount_usages');
    }
};
