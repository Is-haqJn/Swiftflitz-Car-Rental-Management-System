<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('make');
            $table->string('model');
            $table->smallInteger('year')->unsigned();
            $table->string('color');
            $table->string('license_plate')->unique();
            $table->tinyInteger('seats')->unsigned();
            $table->json('features')->nullable();
            $table->boolean('has_insurance')->default(true);
            $table->date('insurance_expiry_date')->nullable();
            $table->boolean('has_roadworthy')->default(true);
            $table->date('roadworthy_expiry_date')->nullable();
            $table->string('status')->default('available');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_vehicles');
    }
};
