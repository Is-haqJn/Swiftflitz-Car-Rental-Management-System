<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('alt_phone')->nullable();
            $table->string('address');
            $table->string('license_number');
            $table->date('license_expiry_date');
            $table->enum('id_type', ['ghana_card', 'passport', 'voter_id']);
            $table->string('id_number', 50);
            $table->date('date_of_birth')->nullable();
            $table->json('emergency_contact')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_blacklisted')->default(false);
            $table->text('blacklist_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
