<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_documents', static function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('type'); // e.g., 'license', 'voter_id', 'ghana_card', 'passport'
            $table->string('file_path'); // path or URL to the uploaded file
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_documents');
    }
};
