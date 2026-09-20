<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_images', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('file_path');
            $table->boolean('is_primary')->default(false)->after('sort_order');

            $table->index(['vehicle_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_images', function (Blueprint $table) {
            $table->dropForeign(['vehicle_id']);
            $table->dropIndex(['vehicle_id', 'sort_order']);
            $table->dropColumn(['sort_order', 'is_primary']);
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->cascadeOnDelete();
        });
    }
};
