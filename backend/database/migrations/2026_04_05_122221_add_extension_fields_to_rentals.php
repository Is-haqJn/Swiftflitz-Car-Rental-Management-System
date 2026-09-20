<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->unsignedInteger('extension_days')->nullable()->after('rental_days');
            $table->date('original_return_date')->nullable()->after('return_date');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn(['extension_days', 'original_return_date']);
        });
    }
};
