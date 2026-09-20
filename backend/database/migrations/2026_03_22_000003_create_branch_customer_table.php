<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_customer', function (Blueprint $table) {
            $table->uuid('branch_id');
            $table->uuid('customer_id');

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();

            $table->primary(['branch_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_customer');
    }
};
