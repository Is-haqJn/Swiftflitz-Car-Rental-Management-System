<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('profile_status', ['incomplete', 'pending_review', 'verified', 'rejected'])
                ->default('incomplete')
                ->after('blacklist_reason');
            $table->date('id_expiry_date')->nullable()->after('id_number');
            $table->timestamp('verified_at')->nullable()->after('profile_status');
            $table->foreignUuid('verified_by')->nullable()->after('verified_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('reupload_token')->nullable()->unique()->after('verified_by');
            $table->timestamp('reupload_token_expires_at')->nullable()->after('reupload_token');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'profile_status',
                'id_expiry_date',
                'verified_at',
                'verified_by',
                'reupload_token',
                'reupload_token_expires_at',
            ]);
        });
    }
};
