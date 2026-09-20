<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('description');
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('security_deposit', 10, 2)->nullable();
            $table->decimal('cancellation_fee', 10, 2)->nullable();
            $table->decimal('before_pickup_cancellation_fee', 10, 2)->nullable();
            $table->decimal('after_pickup_cancellation_fee', 10, 2)->nullable();
            $table->decimal('overdue_fee', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
