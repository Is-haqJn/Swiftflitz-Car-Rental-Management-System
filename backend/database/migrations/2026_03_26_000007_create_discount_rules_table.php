<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('discount_type', ['percentage', 'flat'])->default('flat');
            $table->decimal('discount_value', 10, 2);
            $table->enum('condition_type', [
                'none',
                'rental_duration_days',
                'days_before_pickup',
                'booking_source',
                'customer_completed_rentals',
                'base_amount',
                'vehicle_id',
                'category_id',
            ])->default('none');
            $table->string('condition_value')->nullable();
            $table->boolean('is_stackable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_rules');
    }
};
