<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            /* PERSONAL INFO */
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone_number')->unique();
            $table->string('email')->nullable()->unique();
            $table->date('date_of_birth');
            $table->string('address')->nullable();
            $table->string('city')->nullable();

            /* IDENTITY */
            $table->enum('id_type', [
                'ghana_card',
                'passport',
                'voters_id',
                'drivers_license',
                'ssnit',
                'other',
            ])->nullable();
            $table->string('id_number')->nullable()->unique();
            $table->date('id_expiry_date')->nullable();

            /* LICENSE */
            $table->string('license_number')->unique();
            $table->string('license_class');
            $table->date('license_expiry_date');
            $table->boolean('license_verified')->default(false);

            /* EMERGENCY CONTACT */
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relation')->nullable();

            /* SERVICE ASSIGNMENT */
            $table->boolean('available_for_chauffeur')->default(false);
            $table->boolean('available_for_airport')->default(false);

            /* STATUS */
            $table->enum('status', [
                'available',
                'on_trip',
                'off_duty',
                'suspended',
                'inactive',
            ])->default('available');

            $table->text('notes')->nullable();

            /* TRACKING */
            $table->foreignUuid('created_by')->constrained('users');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
