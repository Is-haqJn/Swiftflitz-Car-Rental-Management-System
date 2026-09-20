<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('revenue_snapshots', function (Blueprint $table) {
            $table->dropUnique(['period_type', 'period_key']);

            /*
             * 'global' = cross-branch aggregate; UUID string = branch-specific.
             * Not a FK - 'global' is a sentinel, not a real branch ID.
             */
            $table->string('branch_id', 36)->default('global')->after('period_type');

            $table->unique(['period_type', 'period_key', 'branch_id']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('revenue_snapshots', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropUnique(['period_type', 'period_key', 'branch_id']);
            $table->dropColumn('branch_id');
            $table->unique(['period_type', 'period_key']);
        });
    }
};
