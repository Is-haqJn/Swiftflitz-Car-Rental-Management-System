<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('additional_charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('scope', ['global', 'category', 'vehicle', 'regular'])->default('regular');
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignUuid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->enum('charge_type', ['flat', 'per_day'])->default('flat');
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('is_waivable')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('additional_charges');
    }
};
