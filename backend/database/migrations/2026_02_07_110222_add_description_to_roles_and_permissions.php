<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', static function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->string('group')->nullable()->after('description');
        });

        Schema::table('roles', static function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->boolean('is_default')->default(false)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', static function (Blueprint $table) {
            $table->dropColumn(['description', 'group']);
        });

        Schema::table('roles', static function (Blueprint $table) {
            $table->dropColumn(['description', 'is_default']);
        });
    }
};
