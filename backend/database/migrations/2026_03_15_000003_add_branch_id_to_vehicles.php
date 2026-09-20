<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->uuid('branch_id')->nullable()->after('category_id');
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->index('branch_id', 'idx_vehicles_branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropIndex('idx_vehicles_branch_id');
            $table->dropColumn('branch_id');
        });
    }
};
