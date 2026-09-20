<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_verification_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('token')->unique();
            $table->string('session_id')->index();
            $table->foreignUuid('customer_id')->constrained()->cascadeOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_verification_tokens');
    }
};
