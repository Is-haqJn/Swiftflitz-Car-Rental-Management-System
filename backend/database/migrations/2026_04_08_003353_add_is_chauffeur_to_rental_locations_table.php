<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_locations', function (Blueprint $table) {
            $table->boolean('is_chauffeur')->default(false)->after('is_dropoff');
        });
    }

    public function down(): void
    {
        Schema::table('rental_locations', function (Blueprint $table) {
            $table->dropColumn('is_chauffeur');
        });
    }
};
