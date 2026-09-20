<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_scopes', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('coupon_id')->constrained('discount_coupons')->cascadeOnDelete();
            $table->string('scope_type');
            $table->string('scope_id')->nullable();
            $table->timestamps();

            $table->index(['coupon_id', 'scope_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_scopes');
    }
};
