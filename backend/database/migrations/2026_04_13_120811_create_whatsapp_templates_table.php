<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('template_name');
            $table->string('default_template_name');
            $table->text('header')->nullable();
            $table->text('default_header')->nullable();
            $table->text('body');
            $table->text('default_body');
            $table->text('footer')->nullable();
            $table->text('default_footer')->nullable();
            $table->json('variables')->nullable();
            $table->json('default_variables')->nullable();
            $table->string('language_code', 10)->default('en_US');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_templates');
    }
};
