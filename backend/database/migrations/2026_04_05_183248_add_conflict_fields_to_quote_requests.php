<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->json('pending_customer_data')->nullable()->after('admin_notes');
            $table->string('conflict_type')->nullable()->after('pending_customer_data');
            $table->foreignUuid('conflicting_customer_id')->nullable()->after('conflict_type')
                ->constrained('customers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropForeign(['conflicting_customer_id']);
            $table->dropColumn(['pending_customer_data', 'conflict_type', 'conflicting_customer_id']);
        });
    }
};
