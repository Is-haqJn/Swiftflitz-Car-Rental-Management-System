<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users', 'id')->cascadeOnDelete()->unique();
            $table->boolean('new_booking')->default(true);
            $table->boolean('return_reminder')->default(true);
            $table->boolean('overdue_alert')->default(true);
            $table->boolean('quote_request')->default(true);
            $table->boolean('email_new_booking')->default(true);
            $table->boolean('email_return_reminder')->default(true);
            $table->boolean('email_overdue_alert')->default(true);
            $table->boolean('email_quote_request')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
