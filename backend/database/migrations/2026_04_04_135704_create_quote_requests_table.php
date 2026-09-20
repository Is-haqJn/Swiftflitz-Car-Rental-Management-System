<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('pickup_location_id')->nullable()->constrained('rental_locations')->nullOnDelete();
            $table->foreignUuid('converted_rental_id')->nullable()->constrained('rentals')->nullOnDelete();
            $table->string('reference')->unique();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->unsignedSmallInteger('rental_days')->nullable();
            $table->date('expected_pickup_date')->nullable();
            $table->date('pickup_date')->nullable();
            $table->date('return_date')->nullable();
            $table->text('vehicle_preference')->nullable();
            $table->text('message')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('status')->default('pending');
            $table->string('quote_token')->nullable()->unique();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('quoted_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_requests');
    }
};
