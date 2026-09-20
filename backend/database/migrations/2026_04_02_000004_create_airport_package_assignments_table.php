<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airport_package_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('package_id')->constrained('airport_packages')->cascadeOnDelete();
            $table->foreignUuid('airport_id')->constrained('airports')->cascadeOnDelete();
            $table->decimal('base_price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['package_id', 'airport_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airport_package_assignments');
    }
};
