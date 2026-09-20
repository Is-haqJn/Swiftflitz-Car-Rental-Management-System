<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->string('description')->nullable()->change();
            $table->date('expense_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_expenses', function (Blueprint $table) {
            $table->string('description')->nullable(false)->change();
            $table->date('expense_date')->nullable(false)->change();
        });
    }
};
