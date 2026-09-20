<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('show endpoint returns address license_number license_expiry_date id_type and id_number', function () {
    $customer = Customer::factory()->create([
        'reupload_token' => 'show-token-abc',
        'reupload_token_expires_at' => now()->addHours(24),
        'address' => '12 Main Street, Accra',
        'license_number' => 'DL-1234-ABCD',
        'license_expiry_date' => '2027-06-30',
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-XXXX-1234',
    ]);

    $response = $this->getJson('/api/v1/public/reupload/show-token-abc')
        ->assertSuccessful();

    expect($response->json('data'))->toMatchArray([
        'address' => '12 Main Street, Accra',
        'license_number' => 'DL-1234-ABCD',
        'license_expiry_date' => '2027-06-30',
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-XXXX-1234',
    ]);
});

it('upload validates required address and license fields', function () {
    $customer = Customer::factory()->create([
        'reupload_token' => 'validate-token-xyz',
        'reupload_token_expires_at' => now()->addHours(24),
    ]);

    $this->postJson('/api/v1/public/reupload/validate-token-xyz', [
        'license_file' => UploadedFile::fake()->image('license.jpg'),
        'id_document_file' => UploadedFile::fake()->image('id.jpg'),
        /* Missing: address, license_number, license_expiry_date, id_type, id_number */
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['address', 'license_number', 'license_expiry_date', 'id_type', 'id_number']);
});

it('upload saves new fields to customer model', function () {
    Storage::fake('media');

    $customer = Customer::factory()->create([
        'reupload_token' => 'save-token-789',
        'reupload_token_expires_at' => now()->addHours(24),
        'address' => 'Old Address',
        'license_number' => 'OLD-LIC',
        'license_expiry_date' => now()->addYear()->format('Y-m-d'),
        'id_type' => 'passport',
        'id_number' => 'OLD-ID',
    ]);

    $newExpiry = now()->addYears(2)->format('Y-m-d');

    $this->postJson('/api/v1/public/reupload/save-token-789', [
        'address' => '99 New Road, Kumasi',
        'license_number' => 'NEW-LIC-555',
        'license_expiry_date' => $newExpiry,
        'id_type' => 'ghana_card',
        'id_number' => 'GHA-NEW-9999',
        'license_file' => UploadedFile::fake()->image('license.jpg'),
        'id_document_file' => UploadedFile::fake()->image('id.jpg'),
    ])->assertSuccessful();

    $customer->refresh();

    expect($customer->address)->toBe('99 New Road, Kumasi')
        ->and($customer->license_number)->toBe('NEW-LIC-555')
        ->and($customer->license_expiry_date->format('Y-m-d'))->toBe($newExpiry)
        ->and($customer->id_type->value)->toBe('ghana_card')
        ->and($customer->id_number)->toBe('GHA-NEW-9999');
});
