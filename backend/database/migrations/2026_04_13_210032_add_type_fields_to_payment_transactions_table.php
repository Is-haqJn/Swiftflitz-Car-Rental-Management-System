<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->string('type')->default('payment')->after('status');
            $table->text('description')->nullable()->after('type');
            $table->decimal('discount_amount', 10, 2)->nullable()->after('description');
            $table->string('discount_reason')->nullable()->after('discount_amount');
            $table->string('coupon_usage_id')->nullable()->after('discount_reason');
            $table->string('discount_rule_usage_id')->nullable()->after('coupon_usage_id');
            $table->foreignUuid('processed_by_user_id')->nullable()->after('discount_rule_usage_id')->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable()->after('processed_by_user_id');

            $table->index('type');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropForeign(['processed_by_user_id']);
            $table->dropIndex(['type']);
            $table->dropIndex(['paid_at']);
            $table->dropColumn([
                'type',
                'description',
                'discount_amount',
                'discount_reason',
                'coupon_usage_id',
                'discount_rule_usage_id',
                'processed_by_user_id',
                'paid_at',
            ]);
        });
    }
};
