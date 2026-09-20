<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->decimal('admin_base_price', 12, 2)->nullable()->after('admin_notes');
            $table->json('requested_addon_ids')->nullable()->after('admin_base_price');
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropColumn(['admin_base_price', 'requested_addon_ids']);
        });
    }
};
