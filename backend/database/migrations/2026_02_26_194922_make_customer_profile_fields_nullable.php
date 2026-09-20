<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('address')->nullable()->change();
            $table->string('license_number')->nullable()->change();
            $table->date('license_expiry_date')->nullable()->change();
            $table->string('id_type')->nullable()->change();
            $table->string('id_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('address')->nullable(false)->change();
            $table->string('license_number')->nullable(false)->change();
            $table->date('license_expiry_date')->nullable(false)->change();
            $table->string('id_type')->nullable(false)->change();
            $table->string('id_number')->nullable(false)->change();
        });
    }
};
