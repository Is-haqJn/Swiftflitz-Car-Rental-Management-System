<?php

use App\Enums\RoleEnum;
use App\Models\NotificationSetting;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\NotificationSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* GET /api/v1/notifications/settings */
it('requires authentication to view notification settings', function () {
    $this->getJson('/api/v1/notifications/settings')
        ->assertUnauthorized();
});

it('returns all notification setting fields including new ones', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications/settings')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('rental_status_change')
        ->and($data)->toHaveKey('email_rental_status_change')
        ->and($data)->toHaveKey('payment_confirmation')
        ->and($data)->toHaveKey('email_payment_confirmation')
        ->and($data)->toHaveKey('document_expiry_alert')
        ->and($data)->toHaveKey('email_document_expiry_alert');
});

it('new notification fields default to true', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/notifications/settings')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data['rental_status_change'])->toBeTrue()
        ->and($data['email_rental_status_change'])->toBeTrue()
        ->and($data['payment_confirmation'])->toBeTrue()
        ->and($data['email_payment_confirmation'])->toBeTrue()
        ->and($data['document_expiry_alert'])->toBeTrue()
        ->and($data['email_document_expiry_alert'])->toBeTrue();
});

/* PUT /api/v1/notifications/settings */
it('can toggle new notification fields off', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/notifications/settings', [
            'rental_status_change' => false,
            'email_rental_status_change' => false,
            'payment_confirmation' => false,
            'email_payment_confirmation' => false,
            'document_expiry_alert' => false,
            'email_document_expiry_alert' => false,
        ])
        ->assertSuccessful();

    $settings = NotificationSetting::where('user_id', $user->id)->first();

    expect($settings->rental_status_change)->toBeFalse()
        ->and($settings->email_rental_status_change)->toBeFalse()
        ->and($settings->payment_confirmation)->toBeFalse()
        ->and($settings->email_payment_confirmation)->toBeFalse()
        ->and($settings->document_expiry_alert)->toBeFalse()
        ->and($settings->email_document_expiry_alert)->toBeFalse();
});

/* NotificationSettingSeeder - super admin defaults */
it('seeder sets all notification settings to false for super admin', function () {
    foreach (RoleEnum::cases() as $role) {
        Role::create(['name' => $role->value, 'guard_name' => 'web']);
    }

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole(RoleEnum::SUPER_ADMIN->value);

    $this->seed(NotificationSettingSeeder::class);

    $settings = NotificationSetting::where('user_id', $superAdmin->id)->first();

    $allColumns = [
        'new_booking', 'return_reminder', 'overdue_alert', 'quote_request',
        'vehicle_expiry', 'pickup_reminder', 'rental_status_change',
        'payment_confirmation', 'document_expiry_alert', 'rental_cancelled',
        'airport_booking', 'airport_booking_cancelled', 'airport_booking_status_changed',
        'chauffeur_booking', 'chauffeur_booking_cancelled', 'chauffeur_booking_status_changed',
        'chauffeur_pickup_reminder', 'driver_document_expiry',
        'email_new_booking', 'email_return_reminder', 'email_overdue_alert',
        'email_quote_request', 'email_vehicle_expiry', 'email_pickup_reminder',
        'email_rental_status_change', 'email_payment_confirmation',
        'email_document_expiry_alert', 'email_rental_cancelled',
        'email_airport_booking', 'email_airport_booking_cancelled',
        'email_airport_booking_status_changed', 'email_chauffeur_booking',
        'email_chauffeur_booking_cancelled', 'email_chauffeur_booking_status_changed',
        'email_chauffeur_pickup_reminder', 'email_driver_document_expiry',
    ];

    foreach ($allColumns as $column) {
        expect($settings->{$column})->toBeFalse("expected {$column} to be false for super_admin");
    }
});

it('seeder leaves non-super-admin settings at db defaults', function () {
    foreach (RoleEnum::cases() as $role) {
        Role::create(['name' => $role->value, 'guard_name' => 'web']);
    }

    $user = User::factory()->create();
    $user->assignRole(RoleEnum::MANAGER->value);

    $this->seed(NotificationSettingSeeder::class);

    $settings = NotificationSetting::where('user_id', $user->id)->first();

    expect($settings->new_booking)->toBeTrue()
        ->and($settings->rental_status_change)->toBeTrue()
        ->and($settings->email_new_booking)->toBeTrue();
});

it('can toggle new notification fields back on', function () {
    $user = User::factory()->create();

    // First disable
    NotificationSetting::updateOrCreate(
        ['user_id' => $user->id],
        ['rental_status_change' => false, 'payment_confirmation' => false]
    );

    // Then re-enable
    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/notifications/settings', [
            'rental_status_change' => true,
            'payment_confirmation' => true,
        ])
        ->assertSuccessful();

    $settings = NotificationSetting::where('user_id', $user->id)->first();

    expect($settings->rental_status_change)->toBeTrue()
        ->and($settings->payment_confirmation)->toBeTrue();
});
