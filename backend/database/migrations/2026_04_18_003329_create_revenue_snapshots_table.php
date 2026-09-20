<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revenue_snapshots', function (Blueprint $table) {
            $table->id();
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'yearly']);
            /* period_key: '2025-04-28' (daily/weekly start), '2025-04' (monthly), '2025' (yearly) */
            $table->string('period_key', 20);
            $table->string('period_label', 30);
            $table->decimal('revenue', 15, 2)->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->timestamp('calculated_at')->useCurrent();
            $table->timestamps();

            $table->unique(['period_type', 'period_key']);
            $table->index('period_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_snapshots');
    }
};
