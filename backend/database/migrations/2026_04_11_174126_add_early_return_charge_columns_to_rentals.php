<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('early_return_charge', 10, 2)->nullable()->after('early_return_refund');
            $table->boolean('early_return_charge_waived')->default(false)->after('early_return_charge');
            $table->foreignUuid('early_return_charge_waived_by')->nullable()->constrained('users')->nullOnDelete()->after('early_return_charge_waived');
            $table->string('early_return_charge_waiver_reason')->nullable()->after('early_return_charge_waived_by');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('early_return_charge_waived_by');
            $table->dropColumn(['early_return_charge', 'early_return_charge_waived', 'early_return_charge_waiver_reason']);
        });
    }
};
