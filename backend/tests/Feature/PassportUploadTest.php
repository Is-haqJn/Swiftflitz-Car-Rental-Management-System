<?php

use App\Models\Customer;
use App\Models\User;
use App\Settings\RentalSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('customer resource exposes passport_images field', function () {
    $customer = Customer::factory()->create();

    $user = User::factory()->create();
    $role = \Spatie\Permission\Models\Role::findOrCreate('super_admin');
    $user->assignRole($role);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/customers/{$customer->id}")
        ->assertSuccessful();

    expect($response->json('data'))->toHaveKey('passport_images');
});

it('public profile submit accepts optional passport_image file', function () {
    Storage::fake('media');

    $customer = Customer::factory()->create([
        'reupload_token' => 'test-token-123',
        'reupload_token_expires_at' => now()->addHours(48),
    ]);

    $file = UploadedFile::fake()->image('passport.jpg', 400, 300);

    $this->postJson('/api/v1/public/customer/complete-profile/test-token-123', [
        'address' => '123 Test Street',
        'license_number' => 'LIC-12345',
        'license_expiry_date' => now()->addYear()->format('Y-m-d'),
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-12345',
        'id_expiry_date' => now()->addYear()->format('Y-m-d'),
        'license_image' => UploadedFile::fake()->image('license.jpg'),
        'id_document' => UploadedFile::fake()->image('id.jpg'),
        'passport_image' => $file,
    ])->assertSuccessful();

    $customer->refresh();
    expect($customer->getMedia('passport'))->toHaveCount(1);
});

it('admin customer update saves passport to passport collection', function () {
    Storage::fake('media');

    $customer = Customer::factory()->create();
    $user = User::factory()->create();
    $role = \Spatie\Permission\Models\Role::findOrCreate('super_admin');
    $user->assignRole($role);

    $file = UploadedFile::fake()->image('passport.jpg');

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/customers/{$customer->id}", array_merge(
            $customer->only(['name', 'email', 'phone', 'address', 'license_number', 'id_type', 'id_number']),
            [
                'license_expiry_date' => now()->addYear()->format('Y-m-d'),
                'passport_image' => $file,
            ]
        ))
        ->assertSuccessful();

    $customer->refresh();
    expect($customer->getMedia('passport'))->toHaveCount(1);
});

it('documents_required setting defaults to true', function () {
    $settings = app(RentalSettings::class);

    expect($settings->documents_required)->toBeTrue();
});
