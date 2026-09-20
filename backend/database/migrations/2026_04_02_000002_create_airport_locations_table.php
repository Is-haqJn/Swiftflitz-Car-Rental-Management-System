<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airport_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('location_type', ['terminal', 'area']);
            $table->foreignUuid('airport_id')->nullable()->constrained('airports')->nullOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('name');
            $table->boolean('has_charge')->default(false);
            $table->decimal('charge_amount', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airport_locations');
    }
};
