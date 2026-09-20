<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rental_inspections', function (Blueprint $table) {
            $table->json('damage_types')->nullable()->after('damage_noted');
            $table->string('damage_severity')->nullable()->after('damage_types');
            $table->text('damage_description')->nullable()->after('damage_severity');
        });
    }

    public function down(): void
    {
        Schema::table('rental_inspections', function (Blueprint $table) {
            $table->dropColumn(['damage_types', 'damage_severity', 'damage_description']);
        });
    }
};
