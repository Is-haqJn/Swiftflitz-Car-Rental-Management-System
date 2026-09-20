<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //columns to be added
            $table->string('username')->unique()->after('name');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('profile_photo_path')->nullable()->after('phone');
            $table->boolean('is_active')->after('profile_photo_path')->nullable()->default(true);
            $table->timestamp('last_login_at')->nullable()->after('is_active');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->dropColumn('username');
            $table->dropColumn('phone');
            $table->dropForeign('role_id');
            $table->dropColumn('profile_photo_path');
            $table->dropColumn('is_active');
            $table->dropColumn('last_login_at');
            //

        });
    }
};
