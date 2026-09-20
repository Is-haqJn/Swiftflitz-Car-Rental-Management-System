<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->boolean('has_airport_service')->default(false)->after('is_active');
            $table->foreignUuid('airport_id')->nullable()->after('has_airport_service')
                ->constrained('airports')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('airport_id');
            $table->dropColumn('has_airport_service');
        });
    }
};
